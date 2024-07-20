package main

import (
	"context"
	"log"
	"os"
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

func downloadFileFromMinio(ctx context.Context, minioClient *minio.Client, bucketName string, objectName string) (string, error) {
	filePath := getCachedPath("./tmp/" + objectName)
	if isCached(filePath) {
		return filePath, nil
	}

	err := minioClient.FGetObject(ctx, bucketName, objectName, filePath, minio.GetObjectOptions{})
	if err != nil {
		return "", err
	}

	return filePath, nil
}

func downloadFilesFromMinio(ctx context.Context, minioClient *minio.Client, bucketName string, objectNames []string) ([]string, error) {
	maxDownloadWorkers := 30
	guard := make(chan struct{}, maxDownloadWorkers)
	downloadedFiles := make(chan string, len(objectNames))

	retryFiles := []string{}

	for _, objectName := range objectNames {
		guard <- struct{}{} // would block if guard channel is already filled
		go func() {
			filepath, err := downloadFileFromMinio(ctx, minioClient, bucketName, objectName)

			downloadedFiles <- filepath

			if err != nil {
				log.Println("Error while downloading file ", objectName, " from Minio:", err)
				retryFiles = append(retryFiles, objectName)
			}
			<-guard
		}()
	}

	for _, objectName := range retryFiles {
		guard <- struct{}{}
		go func() {
			filepath, err := downloadFileFromMinio(ctx, minioClient, bucketName, objectName)

			downloadedFiles <- filepath

			if err != nil {
				log.Println("Error while retrying to download file ", objectName, " from Minio:", err)
			}
			<-guard
		}()
	}

	downloadedFilesSlice := []string{}
	for i := 0; i < len(objectNames); i++ {
		downloadedFilesSlice = append(downloadedFilesSlice, <-downloadedFiles)
	}
	close(downloadedFiles)
	close(guard)

	return downloadedFilesSlice, nil

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
