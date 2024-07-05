package main

import (
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

func setupAMQPConnection(url string) *amqp.Connection {
	conn, err := amqp.Dial(url)
	if err != nil {
		log.Fatal(err)
	}

	return conn
}

func setupAMQPChannel(conn *amqp.Connection) *amqp.Channel {
	ch, err := conn.Channel()
	if err != nil {
		log.Fatal(err)
	}

	return ch
}

func setupAMQPQueue(ch *amqp.Channel, queueName string) amqp.Queue {
	q, err := ch.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		log.Fatal(err)
	}

	return q
}
