package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func setupMinioClient(env Env) *minio.Client {
	minioClient, err := minio.New(env.MinioURL, &minio.Options{
		Creds:  credentials.NewStaticV4(env.MinioKey, env.MinioSecret, ""),
		Secure: false,
	})
	if err != nil {
		log.Fatal(err)
	}

	return minioClient
}

func downloadFileFromMinio(ctx context.Context, minioClient *minio.Client, bucketName string, objectName string, prefix string) (string, error) {
	filePath := "./tmp/" + prefix + "/" + objectName
	cachePath := strings.Replace(filePath, "/tmp/", "/tmp/cache/", 1)

	_, err := os.Stat(cachePath)
	// There is a cached local file
	if err == nil {
		cacheFile, err := os.ReadFile(cachePath)
		if err != nil {
			return "", err
		}
		fileDir := filepath.Dir(filePath)
		err = os.MkdirAll(fileDir, os.ModePerm)
		if err != nil {
			return "", err
		}

		err = os.WriteFile(filePath, cacheFile, os.ModePerm)
		if err != nil {
			return "", err
		}

		return filePath, nil
	}

	err = minioClient.FGetObject(ctx, bucketName, objectName, filePath, minio.GetObjectOptions{})
	if err != nil {
		return "", err
	}

	// Copy the file to cache, if it fails it does not matter
	go func() {
		file, err := os.ReadFile(filePath)
		if err != nil {
			return
		}
		cacheDir := filepath.Dir(cachePath)
		err = os.MkdirAll(cacheDir, os.ModePerm)
		if err != nil {
			return
		}

		err = os.WriteFile(cachePath, file, os.ModePerm)
		if err != nil {
			return
		}
	}()

	return filePath, nil
}

func downloadFilesFromMinio(ctx context.Context, minioClient *minio.Client, bucketName string, objectNames []string, prefix string) error {
	maxDownloadWorkers := 30
	guard := make(chan struct{}, maxDownloadWorkers)
	var waitGroup sync.WaitGroup

	retryFiles := []string{}

	for _, objectName := range objectNames {
		waitGroup.Add(1)
		guard <- struct{}{} // would block if guard channel is already filled
		go func() {
			defer waitGroup.Done()
			_, err := downloadFileFromMinio(ctx, minioClient, bucketName, objectName, prefix)
			if err != nil {
				log.Println("Error while downloading file ", objectName, " from Minio:", err)
				retryFiles = append(retryFiles, objectName)
			}
			<-guard
		}()
	}

	for _, objectName := range retryFiles {
		waitGroup.Add(1)
		guard <- struct{}{}
		go func() {
			defer waitGroup.Done()
			_, err := downloadFileFromMinio(ctx, minioClient, bucketName, objectName, prefix)
			if err != nil {
				log.Println("Error while retrying to download file ", objectName, " from Minio:", err)
			}
			<-guard
		}()
	}

	waitGroup.Wait()
	return nil

}

func uploadFileToMinio(ctx context.Context, minioClient *minio.Client, bucketName string, objectName string, filePath string) error {
	_, err := minioClient.FPutObject(ctx, bucketName, objectName, filePath, minio.PutObjectOptions{})
	if err != nil {
		return err
	}

	return nil
}

func uploadFolderToMinio(ctx context.Context, minioClient *minio.Client, bucketName string, outputPath string, folderPath string) error {
	files, err := os.ReadDir(folderPath)
	if err != nil {
		return err
	}

	maxUploadWorkers := 30
	guard := make(chan struct{}, maxUploadWorkers)
	var waitGroup sync.WaitGroup

	retryFiles := []string{}

	for _, file := range files {
		waitGroup.Add(1)
		guard <- struct{}{} // would block if guard channel is already filled
		filePath := folderPath + "/" + file.Name()
		go func() {
			defer waitGroup.Done()
			err = uploadFileToMinio(ctx, minioClient, bucketName, outputPath+file.Name(), filePath)
			if err != nil {
				log.Println("Error while uploading file ", file.Name(), " to Minio:", err)
				retryFiles = append(retryFiles, file.Name())
			}
			<-guard
		}()
	}

	for _, file := range retryFiles {
		waitGroup.Add(1)
		guard <- struct{}{}
		filePath := folderPath + "/" + file
		go func() {
			defer waitGroup.Done()
			err = uploadFileToMinio(ctx, minioClient, bucketName, outputPath+file, filePath)
			if err != nil {
				log.Println("Error while retrying to upload file ", file, " to Minio:", err)
			}
			<-guard
		}()
	}

	waitGroup.Wait()
	return nil
}
