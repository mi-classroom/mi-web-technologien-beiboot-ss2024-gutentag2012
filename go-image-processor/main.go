package main

import (
	"context"
	"encoding/json"
	"fmt"
	amqp "github.com/rabbitmq/amqp091-go"
	"log"
	"os"
	"strings"
)

type VideoProcessingMessage struct {
	Filename  string `json:"filename"`
	Scale     int    `json:"scale"`
	FromFrame int    `json:"fromFrame"`
	ToFrame   int    `json:"toFrame"`
}

type AmqpMessage struct {
	Pattern string                 `json:"pattern"`
	Data    VideoProcessingMessage `json:"data"`
}

func main() {
	env := configureEnvs()
	ctx := context.Background()

	minio := setupMinioClient(env)

	amqpConnection := setupAMQPConnection(env)
	amqpChannel := setupAMQPChannel(amqpConnection)
	amqpQueue := setupAMQPQueue(amqpChannel, env.AMQPQueueName)

	defer func(amqpConnection *amqp.Connection) {
		err := amqpConnection.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(amqpConnection)
	defer func(amqpChannel *amqp.Channel) {
		err := amqpChannel.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(amqpChannel)

	forever := make(chan bool)

	msgs, err := amqpChannel.Consume(
		amqpQueue.Name, // queue
		"",             // consumer
		true,           // auto-ack
		false,          // exclusive
		false,          // no-local
		false,          // no-wait
		nil,            // args
	)
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		for d := range msgs {
			message := AmqpMessage{}
			err := json.Unmarshal(d.Body, &message)
			if err != nil {
				log.Fatal(err)
			}
			if message.Pattern != "video-processing" {
				log.Fatal("Unknown pattern")
			}
			log.Println("Received a message:", message.Data)

			localPath, err := downloadFileFromMinio(ctx, minio, env.MinioBucketName, message.Data.Filename)
			if err != nil {
				log.Fatal(err)
			}

			outputFolder, outputPath := getFrameOutputPathFromLocalPath(localPath)
			err = os.Mkdir(outputFolder, os.ModePerm)
			if err != nil {
				log.Fatal(err)
			}

			splitVideoIntoFrames(env.FfmpegPath, localPath, outputPath, message.Data.Scale)
			averagePixelValues(outputFolder, message.Data.Filename, message.Data.FromFrame, message.Data.ToFrame)

			err = os.RemoveAll(localPath)
			if err != nil {
				log.Fatal(err)
			}
			err = os.RemoveAll(outputFolder)
			if err != nil {
				log.Fatal(err)
			}
			fmt.Println("Done")
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}

func getFrameOutputPathFromLocalPath(localPath string) (string, string) {
	paths := strings.Split(localPath, ".")
	folder := "." + paths[1] + "-frames"
	return folder, folder + "/ffout%3d.png"
}
