package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
)

type ProgressMessage struct {
	Status      string
	CurrentStep int
	MaxSteps    int
	Timestamp   int
}

func sendProgressMessageToAPI(ctx context.Context, env Env, progressId int, message ProgressMessage) error {
	body, err := json.Marshal(message)
	if err != nil {
		log.Println("Error while sending message to API", err)
		return err
	}

	bodyReader := bytes.NewReader(body)
	request, err := http.NewRequestWithContext(ctx, http.MethodPut, env.APIUrl+"/jobs/"+strconv.Itoa(progressId), bodyReader)
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

type ProjectMeta struct {
	MaxWidth int
	MaxHeight int
	MaxFrameRate int
	Duration    int
}

func sendProjectMetaToAPI(ctx context.Context, env Env, projectId int, message ProjectMeta) error {
	body, err := json.Marshal(message)
	if err != nil {
		log.Println("Error while sending message to API", err)
		return err
	}

	bodyReader := bytes.NewReader(body)
	request, err := http.NewRequestWithContext(ctx, http.MethodPut, env.APIUrl+"/projects/"+strconv.Itoa(projectId) + "/meta", bodyReader)
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
