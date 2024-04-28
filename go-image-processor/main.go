package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	amqp "github.com/rabbitmq/amqp091-go"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

type VideoProcessingMessage struct {
	Filename  string `json:"filename"`
	Scale     int    `json:"scale"`
	FrameRate int    `json:"frameRate"`
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
	videoProcessorQueue := setupAMQPQueue(amqpChannel, env.VideoProcessorQueue)

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
		videoProcessorQueue.Name, // queue
		"",                       // consumer
		true,                     // auto-ack
		false,                    // exclusive
		false,                    // no-local
		false,                    // no-wait
		nil,                      // args
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

			splitVideoIntoFrames(env.FfmpegPath, localPath, outputPath, message.Data.Scale, message.Data.FrameRate)
			fmt.Println("Done splitting video into frames.")

			name, outPath := averagePixelValues(outputFolder, message.Data.Filename, message.Data.FromFrame, message.Data.ToFrame)
			fmt.Println("Done processing frames.")

			err = uploadFileToMinio(ctx, minio, env.MinioBucketName, name, outPath)
			if err != nil {
				log.Fatal(err)
			}
			fmt.Println("Done uploading file to Minio.")

			jsonBody := []byte(`{"filename": "` + name + `", "input": "` + message.Data.Filename + `"}`)
			bodyReader := bytes.NewReader(jsonBody)
			req, err := http.NewRequestWithContext(ctx, http.MethodPost, env.APIUrl+"/image-result", bodyReader)
			if err != nil {
				log.Fatal(err)
			}
			req.Header.Set("Content-Type", "application/json")

			res, err := http.DefaultClient.Do(req)
			if err != nil {
				log.Fatal(err)
			}

			if res.StatusCode != http.StatusOK {
				log.Fatal("Failed to send image result to API")
			}

			resBody, err := io.ReadAll(res.Body)
			if err != nil {
				fmt.Printf("client: could not read response body: %s\n", err)
				os.Exit(1)
			}
			fmt.Printf("client: response body: %s\n", resBody)

			err = os.RemoveAll(localPath)
			if err != nil {
				log.Fatal(err)
			}
			err = os.RemoveAll(outputFolder)
			if err != nil {
				log.Fatal(err)
			}
			err = os.Remove(outPath)
			if err != nil {
				fmt.Println(err)
			}

			fmt.Println("Done, stored file in Minio.", name)
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
