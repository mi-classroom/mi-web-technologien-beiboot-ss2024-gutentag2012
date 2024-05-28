package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
)

type ProgressMessage struct {
	Event       string
	Identifier  string
	CurrentStep int
	MaxSteps    int
	Message     string
}

func sendProgressMessageToAPI(ctx context.Context, env Env, message ProgressMessage) error {
	body, err := json.Marshal(message)
	if err != nil {
		log.Println("Error while sending message to API", err)
		return err
	}

	bodyReader := bytes.NewReader(body)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, env.APIUrl+"/image-result", bodyReader)
	if err != nil {
		log.Println("Error creating new http request", err)
		return err
	}

	request.Header.Set("Content-Type", "application/json")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		log.Println("Error while sending request", err)
		return err
	}

	if response.StatusCode != http.StatusOK {
		log.Println("Server response was not OK", response.StatusCode)
		return errors.New("Invalid Server Response")
	}

	return nil
}
