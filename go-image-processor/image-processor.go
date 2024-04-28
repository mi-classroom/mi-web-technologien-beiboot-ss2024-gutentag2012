package main

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"log"
	"os"
	"strings"
	"sync"
)

type Changeable interface {
	Set(x, y int, c color.Color)
}

func averagePixelValues(outputFolder string, filename string, fromFrames int, toFrames int) {
	numWorkers := 20
	filePaths := make(chan string)
	resultPixels := make(chan []uint32, numWorkers)

	var wg sync.WaitGroup
	wg.Add(numWorkers)

	for i := 0; i < numWorkers; i++ {
		go pixelAdditionWorker(filePaths, &wg, resultPixels)
	}

	outputFilesAll, err := os.ReadDir(outputFolder)
	if err != nil {
		log.Fatal(err)
	}

	if fromFrames == -1 {
		fromFrames = 0
	}
	if toFrames == -1 {
		toFrames = len(outputFilesAll)
	}

	outputFiles := outputFilesAll[fromFrames:toFrames]
	for _, outputFile := range outputFiles {
		filePaths <- outputFolder + "/" + outputFile.Name()
	}
	// Close the channel once all files are processed
	close(filePaths)

	firstImageFile, err := os.Open(outputFolder + "/" + outputFiles[0].Name())
	if err != nil {
		log.Fatal(err)
	}
	defer func(firstImageFile *os.File) {
		err := firstImageFile.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(firstImageFile)

	finalImage, err := png.Decode(firstImageFile)
	if err != nil {
		log.Fatal(err)
	}

	// Wait for all workers to finish
	wg.Wait()
	close(resultPixels)

	if cimg, ok := finalImage.(Changeable); ok {
		bounds := finalImage.Bounds()
		width, height := bounds.Dx(), bounds.Dy()
		combinedPixels := make([]uint32, 4*width*height)
		for pixelArray := range resultPixels {
			for pixelIndex, pixelValue := range pixelArray {
				combinedPixels[pixelIndex] += pixelValue
			}
		}

		totalImages := len(outputFiles)
		for pixelIndex := 0; pixelIndex < len(combinedPixels); pixelIndex += 4 {
			trackIndex := pixelIndex / 4
			x := trackIndex % width
			y := trackIndex / width

			r := combinedPixels[pixelIndex] / uint32(totalImages)
			g := combinedPixels[pixelIndex+1] / uint32(totalImages)
			b := combinedPixels[pixelIndex+2] / uint32(totalImages)
			a := combinedPixels[pixelIndex+3] / uint32(totalImages)

			cimg.Set(x, y, color.RGBA{uint8(r), uint8(g), uint8(b), uint8(a)})
		}

		nameParts := strings.Split(filename, ".")
		name := nameParts[0]
		fmt.Println(name, nameParts)
		outFile, err := os.Create("./tmp/" + name + ".png")
		if err != nil {
			log.Fatal(err)
		}

		err = png.Encode(outFile, finalImage)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		log.Fatal("Image could not be written to")
	}
}

func pixelAdditionWorker(filePaths <-chan string, wg *sync.WaitGroup, resultPixels chan<- []uint32) {
	defer wg.Done()

	var matrix []uint32

	for filePath := range filePaths {
		file, err := os.Open(filePath)
		if err != nil {
			log.Fatal(err)
		}

		img, err := png.Decode(file)
		if err != nil {
			log.Fatal(err)
		}

		bounds := img.Bounds()
		width, height := bounds.Dx(), bounds.Dy()

		if len(matrix) == 0 {
			matrix = make([]uint32, 4*width*height)
		}

		imageWithPixAccess, couldCast := img.(*image.RGBA)
		if !couldCast {
			log.Fatal("Was unable to access pix of image")
		}

		for pixelIndex, pixelValue := range imageWithPixAccess.Pix {
			matrix[pixelIndex] += uint32(pixelValue)
		}

		file.Close()
	}
	resultPixels <- matrix
}
