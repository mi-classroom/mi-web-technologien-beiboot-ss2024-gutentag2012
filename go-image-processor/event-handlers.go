package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"github.com/minio/minio-go/v7"
)

func getMsTimestamp() int {
	return int(time.Now().UnixNano() / int64(time.Millisecond))
}

type CreateStackMessage struct {
	Filename        string `json:"videoFile"`
	ProjectPrefix   string `json:"projectPrefix"`
	StackPrefix     string `json:"stackPrefix"`
	FromTime        string `json:"fromTimestamp"`
	ToTime          string `json:"toTimestamp"`
	FrameRate       int    `json:"frameRate"`
	Scale           int    `json:"scale"`
	ProcessingJobId int    `json:"processingJobId"`
}

const MaxStepsStack = 3

func createStack(ctx context.Context, env Env, minioClient *minio.Client, data CreateStackMessage) error {
	log.Println("Creating stack for project:", data.ProjectPrefix)
	CurrentStep := 1
	sendProgress := func(status string) {
		err := sendProgressMessageToAPI(ctx, env, data.ProcessingJobId, ProgressMessage{
			Status:      status,
			MaxSteps:    MaxStepsStack,
			CurrentStep: CurrentStep,
			Timestamp:   getMsTimestamp(),
		})
		CurrentStep += 1
		if err != nil {
			log.Println("Could not message API")
		}
	}
	sendProgress("processing")

	localPath, err := downloadFileFromMinio(ctx, minioClient, env.MinioBucketName, data.ProjectPrefix+"/"+data.Filename)
	if err != nil {
		log.Println("Error while downloading file from Minio:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done downloading file from Minio.")
	sendProgress("processing")

	workingDir := "./tmp/" + data.StackPrefix
	outputPath := workingDir + "/%5d.jpg"
	err = os.MkdirAll(workingDir, os.ModePerm)
	if err != nil {
		log.Println("Error while creating output folder:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done creating output folder.")

	err = splitVideoIntoFrames(env.FfmpegPath, localPath, outputPath, data.Scale, data.FrameRate, data.FromTime, data.ToTime)
	if err != nil {
		log.Println("Error while splitting video into frames:", err)
		sendProgress("error")
		return err
	}
	log.Printf("Done splitting video into frames.")
	sendProgress("processing")

	minioOutputFolder := data.ProjectPrefix + "/" + data.StackPrefix + "/"
	err = uploadFolderToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, workingDir)
	if err != nil {
		log.Println("Error while uploading frames to Minio:", err)
		sendProgress("error")
		return err
	}
	log.Printf("Done uploading frames to Minio.")
	sendProgress("done")

	err = os.RemoveAll(workingDir)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}

type GenerateImageMessage struct {
	OutFilename     string `json:"outFilename"`
	Filename        string `json:"videoFile"`
	ProjectPrefix   string `json:"projectPrefix"`
	StackPrefix     string `json:"stackPrefix"`
	Frames          []int  `json:"frames"`
	Weights         []int  `json:"weights"`
	ProcessingJobId int    `json:"processingJobId"`
}

const MaxStepsImage = 3

func generateImage(ctx context.Context, env Env, minioClient *minio.Client, data GenerateImageMessage) error {
	log.Println("Generating image for project:", data.ProjectPrefix)
	CurrentStep := 0
	sendProgress := func(status string) {
		err := sendProgressMessageToAPI(ctx, env, data.ProcessingJobId, ProgressMessage{
			Status:      status,
			MaxSteps:    MaxStepsImage,
			CurrentStep: CurrentStep,
			Timestamp:   getMsTimestamp(),
		})
		CurrentStep += 1
		if err != nil {
			log.Println("Could not message API")
		}
	}

	sendProgress("processing")
	workingDir := "./tmp/" + data.ProjectPrefix + "/" + data.StackPrefix
	err := os.MkdirAll(workingDir, os.ModePerm)
	if err != nil {
		log.Println("Error while creating image-gen folder:", err)
		sendProgress("error")
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
			fileNames = append(fileNames, fmt.Sprintf("%s/%s/%05d.jpg", data.ProjectPrefix, data.StackPrefix, frame))
		}
	}

	filePaths, err := downloadFilesFromMinio(ctx, minioClient, env.MinioBucketName, fileNames)
	if err != nil {
		log.Println("Error while downloading frames from Minio:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done downloading frames from Minio.")
	sendProgress("processing")

	outPath := workingDir + "/" + data.OutFilename + ".jpg"
	err = averagePixelValues(filePaths, outPath, data.Weights, totalUsedWeights)
	if err != nil {
		log.Println("Error while averaging pixel values:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done averaging pixel values.")
	sendProgress("processing")

	minioOutputFolder := data.ProjectPrefix + "/" + data.StackPrefix + "/outputs/" + data.OutFilename + ".jpg"
	err = uploadFileToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outPath)
	if err != nil {
		log.Println("Error while uploading image to Minio:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done uploading image to Minio.")
	sendProgress("done")

	err = os.RemoveAll(workingDir)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}

type GenerateThumbnailMessage struct {
	Project         string `json:"prefix"`
	File            string `json:"videoFile"`
	ProcessingJobId int    `json:"processingJobId"`
	ProjectId       int    `json:"projectId"`
}

const MaxStepsThumbnail = 5

func processProject(ctx context.Context, env Env, minioClient *minio.Client, data GenerateThumbnailMessage) error {
	log.Println("Generating thumbnail for project:", data.Project)
	CurrentStep := 0
	sendProgress := func(status string) {
		err := sendProgressMessageToAPI(ctx, env, data.ProcessingJobId, ProgressMessage{
			Status:      status,
			MaxSteps:    MaxStepsThumbnail,
			CurrentStep: CurrentStep,
			Timestamp:   getMsTimestamp(),
		})
		CurrentStep += 1
		if err != nil {
			log.Println("Could not message API")
		}
	}

	randomIdentifier := strconv.Itoa(rand.Intn(1000000))
	workingDir := "./tmp/" + data.Project + "-" + randomIdentifier
	err := os.MkdirAll(workingDir, os.ModePerm)
	if err != nil {
		log.Println("Error while creating image-gen folder:", err)
		return err
	}
	sendProgress("processing")

	localPath, err := downloadFileFromMinio(ctx, minioClient, env.MinioBucketName, data.Project+"/"+data.File)
	if err != nil {
		log.Println("Error while downloading file from Minio:", err)
		_ = sendProgressMessageToAPI(ctx, env, data.ProcessingJobId, ProgressMessage{
			Status:      "error",
			MaxSteps:    MaxStepsThumbnail,
			CurrentStep: 0,
			Timestamp:   getMsTimestamp(),
		})
		return err
	}
	log.Println("Done downloading file from Minio.")
	sendProgress("processing")

	meta, err := getVideoMetaData(env.FfprobePath, localPath)
	if err != nil {
		log.Println("Error while getting video meta data:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done getting video meta data.")
	sendProgress("processing")

	err = sendProjectMetaToAPI(ctx, env, data.ProjectId, ProjectMeta{
		MaxWidth:     meta.MaxWidth,
		MaxHeight:    meta.MaxHeight,
		MaxFrameRate: meta.MaxFrameRate,
		Duration:     meta.Duration,
	})
	if err != nil {
		log.Println("Could not message API")
		sendProgress("error")
		return err
	}
	log.Println("Done sending project meta data.")
	sendProgress("processing")

	outPath := workingDir + "/thumbnail.jpg"
	err = splitThumbnailFromVideo(env.FfmpegPath, localPath, outPath)
	if err != nil {
		log.Println("Error while generating thumbnail:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done generating thumbnail.")
	sendProgress("processing")

	minioOutputFolder := data.Project + "/thumbnail.jpg"
	err = uploadFileToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outPath)
	if err != nil {
		log.Println("Error while uploading thumbnail to Minio:", err)
		sendProgress("error")
		return err
	}
	log.Println("Done uploading thumbnail to Minio.")
	sendProgress("done")

	err = os.RemoveAll(workingDir)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}
