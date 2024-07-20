package main

import (
	"github.com/joho/godotenv"
	"log"
	"os"
	"strconv"
)

type Env struct {
	FfmpegPath string

	MinioURL        string
	MinioBucketName string
	MinioKey        string
	MinioSecret     string

	AMQPUrl string

	VideoProcessorQueue string

	APIUrl string

	CacheSizeGB int64
}

func configureEnvs() Env {
	err := godotenv.Load()
	if err != nil {
		log.Println(err)
	}

	cacheSize, err := strconv.ParseInt(os.Getenv("CACHE_SIZE_GB"), 10, 64)
	if err != nil {
		cacheSize = 1
	}

	return Env{
		os.Getenv("FFMPEG_BINARY_PATH"),
		os.Getenv("MINIO_ENDPOINT"),
		os.Getenv("MINIO_BUCKET_NAME"),
		os.Getenv("MINIO_ACCESS_KEY"),
		os.Getenv("MINIO_SECRET_KEY"),
		os.Getenv("AMQP_URL"),
		os.Getenv("VIDEO_PROCESSOR_QUEUE"),
		os.Getenv("API_URL"),
		cacheSize,
	}
}
