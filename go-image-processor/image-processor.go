package main

import (
	"image"
	"image/color"
	"image/png"
	"log"
	"os"
	"sync"
)

type Changeable interface {
	Set(x, y int, c color.Color)
}

func averagePixelValues(outputFolder string, outPath string) error {
	numWorkers := 20
	filePaths := make(chan string)
	resultPixels := make(chan []uint32, numWorkers)

	var wg sync.WaitGroup
	wg.Add(numWorkers)

	for i := 0; i < numWorkers; i++ {
		go pixelAdditionWorker(filePaths, &wg, resultPixels)
	}

	outputFiles, err := os.ReadDir(outputFolder)
	if err != nil {
		log.Println("Error while reading output folder:", err)
		return err
	}

	for _, outputFile := range outputFiles {
		if outputFile.IsDir() {
			continue
		}
		filePaths <- outputFolder + "/" + outputFile.Name()
	}
	// Close the channel once all files are processed
	close(filePaths)

	firstImageFile, err := os.Open(outputFolder + "/" + outputFiles[0].Name())
	if err != nil {
		log.Println("Error while opening first image file:", err)
		return err
	}
	defer func(firstImageFile *os.File) {
		err := firstImageFile.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(firstImageFile)

	finalImage, err := png.Decode(firstImageFile)
	if err != nil {
		log.Println("Error while decoding first image file:", err)
		return err
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

		outFile, err := os.Create(outPath)
		defer func(outFile *os.File) {
			err := outFile.Close()
			if err != nil {
				log.Fatal(err)
			}
		}(outFile)

		if err != nil {
			log.Println("Error while creating output file:", err)
			return err
		}

		err = png.Encode(outFile, finalImage)
		if err != nil {
			log.Println("Error while encoding output file:", err)
			return err
		}
	} else {
		log.Println("Was unable to access pix of image")
		return err
	}
	return nil
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
