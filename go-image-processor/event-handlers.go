package main

import (
	"context"
	"fmt"
	"github.com/minio/minio-go/v7"
	"log"
	"os"
	"strconv"
	"strings"
)

type CreateStackMessage struct {
	Filename  string `json:"filename"`
	Scale     int    `json:"scale"`
	FrameRate int    `json:"frameRate"`
	FromTime  string `json:"from"`
	ToTime    string `json:"to"`
}

func createStack(ctx context.Context, env Env, minioClient *minio.Client, data CreateStackMessage) error {
	project := strings.Split(data.Filename, "/input.")[0]

	log.Println("Creating stack for project:", project)

	localPath, err := downloadFileFromMinio(ctx, minioClient, env.MinioBucketName, data.Filename, "create-stack")
	if err != nil {
		log.Println("Error while downloading file from Minio:", err)
		return err
	}
	log.Println("Done downloading file from Minio.")

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

	minioOutputFolder := project + fmt.Sprintf("/output--scale=%d--frameRate=%d--from=%s--to=%s/", data.Scale, data.FrameRate, strings.ReplaceAll(data.FromTime, ":", "-"), strings.ReplaceAll(data.ToTime, ":", "-"))
	err = uploadFolderToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outputFolder)
	if err != nil {
		log.Println("Error while uploading frames to Minio:", err)
		return err
	}
	log.Printf("Done uploading frames to Minio.")

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

func generateImage(ctx context.Context, env Env, minioClient *minio.Client, data GenerateImageMessage) error {
	log.Println("Generating image for project:", data.Project, "and stack:", data.Stack)

	err := os.MkdirAll("./tmp/generate-image/"+data.Project+"/"+data.Stack+"/outputs", os.ModePerm)
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

	strSlice := make([]string, len(data.Frames))
	for i, num := range data.Frames {
		strSlice[i] = strconv.Itoa(num)
	}
	frameString := strings.Join(strSlice, "-")

	outPath := "./tmp/generate-image/" + data.Project + "/" + data.Stack + "/outputs/" + frameString + ".png"
	err = averagePixelValues("./tmp/generate-image/"+data.Project+"/"+data.Stack, outPath)
	if err != nil {
		log.Println("Error while averaging pixel values:", err)
		return err
	}
	log.Println("Done averaging pixel values.")

	minioOutputFolder := data.Project + "/" + data.Stack + "/outputs/" + frameString + ".png"
	err = uploadFileToMinio(ctx, minioClient, env.MinioBucketName, minioOutputFolder, outPath)
	if err != nil {
		log.Println("Error while uploading image to Minio:", err)
		return err
	}
	log.Println("Done uploading image to Minio.")

	err = os.RemoveAll("./tmp/generate-image/" + data.Project)
	if err != nil {
		log.Println("Error while removing project folder:", err)
		return err
	}
	log.Println("Done removing project folder.")
	return nil
}
