package main

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type Env struct {
	FfmpegPath string

	MinioURL        string
	MinioBucketName string
	MinioKey        string
	MinioSecret     string

	AMQPUrl       string
	AMQPQueueName string
}

func configureEnvs() Env {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	return Env{
		os.Getenv("FFMPEG_BINARY_PATH"),
		os.Getenv("MINIO_ENDPOINT"),
		os.Getenv("MINIO_BUCKET_NAME"),
		os.Getenv("MINIO_ACCESS_KEY"),
		os.Getenv("MINIO_SECRET_KEY"),
		os.Getenv("AMQP_URL"),
		os.Getenv("VIDEO_PROCESSOR_QUEUE"),
	}
}
