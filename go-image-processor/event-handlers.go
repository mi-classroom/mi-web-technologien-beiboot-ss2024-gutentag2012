package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/minio/minio-go/v7"
)

type CreateStackMessage struct {
	Filename  string `json:"filename"`
	Scale     int    `json:"scale"`
	FrameRate int    `json:"frameRate"`
	FromTime  string `json:"from"`
	ToTime    string `json:"to"`
}

const MAX_STEPS_STACK = 3

func createStack(ctx context.Context, env Env, minioClient *minio.Client, data CreateStackMessage) error {
	project := strings.Split(data.Filename, "/input.")[0]
	identifier := fmt.Sprintf("%s-%d-%d-%s-%s", data.Filename, data.FrameRate, data.Scale, data.FromTime, data.ToTime)

	log.Println("Creating stack for project:", project)
	err := sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "create-stack",
		MaxSteps:    MAX_STEPS_STACK,
		CurrentStep: 0,
		Message:     "Downloading video file...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	localPath, err := downloadFileFromMinio(ctx, minioClient, env.MinioBucketName, data.Filename, "create-stack")
	if err != nil {
		log.Println("Error while downloading file from Minio:", err)
		return err
	}
	log.Println("Done downloading file from Minio.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "create-stack",
		MaxSteps:    MAX_STEPS_STACK,
		CurrentStep: 1,
		Message:     "Extracting frames from video...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	outputFolder, outputPath := getFrameOutputPathFromLocalPath(localPath)
	err = os.Mkdir(outputFolder, os.ModePerm)
	if err != nil {
		log.Println("Error while creating output folder:", err)
		return err
	}
	log.Println("Done creating output folder.")

	err = splitVideoIntoFrames(env.FfmpegPath, localPath, outputPath, data.Scale, data.FrameRate, data.FromTime, data.ToTime)
	if err != nil {
		log.Println("Error while splitting video into frames:", err)
		return err
	}
	log.Printf("Done splitting video into frames.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "create-stack",
		MaxSteps:    MAX_STEPS_STACK,
		CurrentStep: 2,
		Message:     "Uploding frames to server...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	minioOutputFolder := project + fmt.Sprintf("/output--scale=%d--frameRate=%d--from=%s--to=%s/", data.Scale, data.FrameRate, strings.ReplaceAll(data.FromTime, ":", "-"), strings.ReplaceAll(data.ToTime, ":", "-"))
	err = uploadFolderToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outputFolder)
	if err != nil {
		log.Println("Error while uploading frames to Minio:", err)
		return err
	}
	log.Printf("Done uploading frames to Minio.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "create-stack",
		MaxSteps:    MAX_STEPS_STACK,
		CurrentStep: 3,
		Message:     "Finished process.",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	err = os.RemoveAll("./tmp/create-stack/" + project)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}

type GenerateImageMessage struct {
	Project string `json:"project"`
	Stack   string `json:"stack"`
	Frames  []int  `json:"frames"`
}

const MAX_STEPS_IMAGE = 3

func generateImage(ctx context.Context, env Env, minioClient *minio.Client, data GenerateImageMessage) error {
	log.Println("Generating image for project:", data.Project, "and stack:", data.Stack)

	strSlice := make([]string, len(data.Frames))
	for i, num := range data.Frames {
		strSlice[i] = strconv.Itoa(num)
	}
	frameString := strings.Join(strSlice, "-")
	identifier := fmt.Sprintf("%s-%s-%s", data.Project, data.Stack, frameString)

	err := sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MAX_STEPS_IMAGE,
		CurrentStep: 0,
		Message:     "Downloading frames...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	err = os.MkdirAll("./tmp/generate-image/"+data.Project+"/"+data.Stack+"/outputs", os.ModePerm)
	if err != nil {
		log.Println("Error while creating image-gen folder:", err)
		return err
	}

	// Download all frames of this project and stack that are requested within the frames
	fileNames := []string{}
	for i := 0; i < len(data.Frames)-1; i += 2 {
		start := data.Frames[i]
		end := data.Frames[i+1]

		for frame := start; frame <= end; frame++ {
			fileNames = append(fileNames, fmt.Sprintf("%s/%s/ffout%05d.png", data.Project, data.Stack, frame))
		}
	}

	err = downloadFilesFromMinio(ctx, minioClient, env.MinioBucketName, fileNames, "generate-image")
	if err != nil {
		log.Println("Error while downloading frames from Minio:", err)
		return err
	}
	log.Println("Done downloading frames from Minio.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MAX_STEPS_IMAGE,
		CurrentStep: 1,
		Message:     "Generating image...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	outPath := "./tmp/generate-image/" + data.Project + "/" + data.Stack + "/outputs/" + frameString + ".png"
	err = averagePixelValues("./tmp/generate-image/"+data.Project+"/"+data.Stack, outPath)
	if err != nil {
		log.Println("Error while averaging pixel values:", err)
		return err
	}
	log.Println("Done averaging pixel values.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MAX_STEPS_IMAGE,
		CurrentStep: 2,
		Message:     "Uploading image...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	minioOutputFolder := data.Project + "/" + data.Stack + "/outputs/" + frameString + ".png"
	err = uploadFileToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outPath)
	if err != nil {
		log.Println("Error while uploading image to Minio:", err)
		return err
	}
	log.Println("Done uploading image to Minio.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MAX_STEPS_IMAGE,
		CurrentStep: 3,
		Message:     "Finished process.",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	err = os.RemoveAll("./tmp/generate-image/" + data.Project)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}
