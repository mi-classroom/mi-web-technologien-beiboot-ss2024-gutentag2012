package main

import (
	"context"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"log"
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
	filePath := "./tmp/" + objectName
	err := minioClient.FGetObject(ctx, bucketName, objectName, filePath, minio.GetObjectOptions{})
	if err != nil {
		return "", err
	}

	return filePath, nil
}

func uploadFileToMinio(ctx context.Context, minioClient *minio.Client, bucketName string, objectName string, filePath string) error {
	_, err := minioClient.FPutObject(ctx, bucketName, objectName, filePath, minio.PutObjectOptions{})
	if err != nil {
		return err
	}

	return nil
}
