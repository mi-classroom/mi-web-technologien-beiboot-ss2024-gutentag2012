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

const MaxStepsStack = 3

func createStack(ctx context.Context, env Env, minioClient *minio.Client, data CreateStackMessage) error {
	project := strings.Split(data.Filename, "/input.")[0]
	identifier := fmt.Sprintf("%s-%d-%d-%s-%s", data.Filename, data.FrameRate, data.Scale, data.FromTime, data.ToTime)

	log.Println("Creating stack for project:", project)
	err := sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "create-stack",
		MaxSteps:    MaxStepsStack,
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
		MaxSteps:    MaxStepsStack,
		CurrentStep: 1,
		Message:     "Extracting frames from video...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	outputFolder, outputPath := getFrameOutputPathFromLocalPath(localPath)
	err = os.MkdirAll(outputFolder, os.ModePerm)
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
		MaxSteps:    MaxStepsStack,
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
		MaxSteps:    MaxStepsStack,
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
	Weights []int  `json:"weights"`
}

const MaxStepsImage = 3

func generateImage(ctx context.Context, env Env, minioClient *minio.Client, data GenerateImageMessage) error {
	log.Println("Generating image for project:", data.Project, "and stack:", data.Stack)

	frameStrings := make([]string, len(data.Frames))
	for i, num := range data.Frames {
		frameStrings[i] = strconv.Itoa(num)
	}
	frameString := strings.Join(frameStrings, "-")

	identifier := fmt.Sprintf("%s-%s-%s", data.Project, data.Stack, frameString)
	outFileName := fmt.Sprintf("%s", frameString)

	err := sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MaxStepsImage,
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
	var fileNames []string
	totalUsedWeights := 0
	for i := 0; i < len(data.Frames)-1; i += 2 {
		start := data.Frames[i]
		end := data.Frames[i+1]

		for frame := start; frame <= end; frame++ {
			totalUsedWeights += data.Weights[frame-1]
			fileNames = append(fileNames, fmt.Sprintf("%s/%s/%05d.png", data.Project, data.Stack, frame))
		}
	}

	filePaths, err := downloadFilesFromMinio(ctx, minioClient, env.MinioBucketName, fileNames, "generate-image")
	if err != nil {
		log.Println("Error while downloading frames from Minio:", err)
		return err
	}
	log.Println("Done downloading frames from Minio.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MaxStepsImage,
		CurrentStep: 1,
		Message:     "Generating image...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	outPath := "./tmp/generate-image/" + data.Project + "/" + data.Stack + "/outputs/" + outFileName + ".png"
	err = averagePixelValues(filePaths, outPath, data.Weights, totalUsedWeights)
	if err != nil {
		log.Println("Error while averaging pixel values:", err)
		return err
	}
	log.Println("Done averaging pixel values.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MaxStepsImage,
		CurrentStep: 2,
		Message:     "Uploading image...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	minioOutputFolder := data.Project + "/" + data.Stack + "/outputs/" + outFileName + ".png"
	err = uploadFileToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outPath)
	if err != nil {
		log.Println("Error while uploading image to Minio:", err)
		return err
	}
	log.Println("Done uploading image to Minio.")
	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  identifier,
		Event:       "generate-image",
		MaxSteps:    MaxStepsImage,
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

type GenerateThumbnailMessage struct {
	Project string `json:"project"`
	File    string `json:"file"`
}

const MaxStepsThumbnail = 3

func generateThumbnail(ctx context.Context, env Env, minioClient *minio.Client, data GenerateThumbnailMessage) error {
	log.Println("Generating thumbnail for project:", data.Project)

	err := os.MkdirAll("./tmp/generate-thumbnail/"+data.Project, os.ModePerm)
	if err != nil {
		log.Println("Error while creating image-gen folder:", err)
		return err
	}

	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  data.Project,
		Event:       "generate-thumbnail",
		MaxSteps:    MaxStepsThumbnail,
		CurrentStep: 0,
		Message:     "Downloading video file...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	localPath, err := downloadFileFromMinio(ctx, minioClient, env.MinioBucketName, data.Project+"/"+data.File, "generate-thumbnail")
	if err != nil {
		log.Println("Error while downloading file from Minio:", err)
		return err
	}
	log.Println("Done downloading file from Minio.")

	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  data.Project,
		Event:       "generate-thumbnail",
		MaxSteps:    MaxStepsThumbnail,
		CurrentStep: 1,
		Message:     "Extracting thumbnail from video...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	err = splitThumbnailFromVideo(env.FfmpegPath, localPath, "./tmp/generate-thumbnail/"+data.Project+"/thumbnail.png")
	if err != nil {
		log.Println("Error while generating thumbnail:", err)
		return err
	}
	log.Println("Done generating thumbnail.")

	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  data.Project,
		Event:       "generate-thumbnail",
		MaxSteps:    MaxStepsThumbnail,
		CurrentStep: 2,
		Message:     "Uploading thumbnail...",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	minioOutputFolder := data.Project + "/thumbnail.png"
	err = uploadFileToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, "./tmp/generate-thumbnail/"+data.Project+"/thumbnail.png")
	if err != nil {
		log.Println("Error while uploading thumbnail to Minio:", err)
		return err
	}
	log.Println("Done uploading thumbnail to Minio.")

	err = sendProgressMessageToAPI(ctx, env, ProgressMessage{
		Identifier:  data.Project,
		Event:       "generate-thumbnail",
		MaxSteps:    MaxStepsThumbnail,
		CurrentStep: 3,
		Message:     "Finished process.",
	})
	if err != nil {
		log.Println("Could not message API")
	}

	err = os.RemoveAll("./tmp/generate-thumbnail/" + data.Project)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}
