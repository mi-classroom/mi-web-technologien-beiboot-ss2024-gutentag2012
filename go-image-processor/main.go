package main

import (
	"context"
	"encoding/json"
	amqp "github.com/rabbitmq/amqp091-go"
	"log"
)

type AmqpMessage struct {
	Pattern string          `json:"pattern"`
	Data    json.RawMessage `json:"data"`
}

func main() {
	env := configureEnvs()
	ctx := context.Background()

	minio := setupMinioClient(env)
	clearLeastRecentlyUsedCache(env)

	amqpConnection := setupAMQPConnection(env.AMQPUrl)
	amqpChannel := setupAMQPChannel(amqpConnection)
	videoProcessorQueue := setupAMQPQueue(amqpChannel, "main")

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

			log.Println("Received a message:", message.Pattern)

			switch message.Pattern {
			case "create-stack":
				messageData := CreateStackMessage{}
				err := json.Unmarshal(message.Data, &messageData)
				if err != nil {
					log.Println("Error while parsing message", err)
					continue
				}

				err = createStack(ctx, env, minio, messageData)
				if err != nil {
					log.Println("Error while processing message", err)
				}
			case "generate-image":
				messageData := GenerateImageMessage{}
				err := json.Unmarshal(message.Data, &messageData)
				if err != nil {
					log.Println("Error while parsing message", err)
					continue
				}

				err = generateImage(ctx, env, minio, messageData)
				if err != nil {
					log.Println("Error while processing message", err)
				}
			case "process-project":
				messageData := GenerateThumbnailMessage{}
				err := json.Unmarshal(message.Data, &messageData)
				if err != nil {
					log.Println("Error while parsing message", err)
					continue
				}

				err = processProject(ctx, env, minio, messageData)
				if err != nil {
					log.Println("Error while processing message", err)
				}
			default:
				log.Fatal("Unknown pattern")
			}

			clearLeastRecentlyUsedCache(env)
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}
