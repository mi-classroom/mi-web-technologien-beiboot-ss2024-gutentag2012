package main

import (
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
