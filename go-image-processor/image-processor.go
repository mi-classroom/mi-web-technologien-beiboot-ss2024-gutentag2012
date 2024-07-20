package main

import (
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"log"
	"os"
	"strconv"
	"sync"
)

func averagePixelValues(filePaths []string, outPath string, weights []int, totalWeights int) error {
	numWorkers := 35
	filePathChannel := make(chan string)
	resultPixels := make(chan []uint32, numWorkers)

	var wg sync.WaitGroup
	wg.Add(numWorkers)

	for i := 0; i < numWorkers; i++ {
		go pixelAdditionWorker(filePathChannel, &wg, resultPixels, weights)
	}

	for _, outputFile := range filePaths {
		filePathChannel <- outputFile
	}
	// Close the channel once all files are processed
	close(filePathChannel)

	firstImageFile, err := os.Open(filePaths[0])
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

	firstImage, err := jpeg.Decode(firstImageFile)
	if err != nil {
		log.Println("Error while decoding first image file:", err)
		return err
	}
	bounds := firstImage.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	finalImage := image.NewRGBA(bounds)

	// Wait for all workers to finish
	wg.Wait()
	close(resultPixels)

	combinedPixels := make([]uint32, 4*width*height)
	for pixelArray := range resultPixels {
		for pixelIndex, pixelValue := range pixelArray {
			combinedPixels[pixelIndex] += pixelValue
		}
	}

	for pixelIndex := 0; pixelIndex < len(combinedPixels); pixelIndex += 4 {
		trackIndex := pixelIndex / 4
		x := trackIndex % width
		y := trackIndex / width

		r := combinedPixels[pixelIndex] / uint32(totalWeights)
		g := combinedPixels[pixelIndex+1] / uint32(totalWeights)
		b := combinedPixels[pixelIndex+2] / uint32(totalWeights)

		finalImage.Set(x, y, color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255})
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

	err = jpeg.Encode(outFile, finalImage, nil)
	if err != nil {
		log.Println("Error while encoding output file:", err)
		return err
	}
	return nil
}

func pixelAdditionWorker(filePathChannel <-chan string, wg *sync.WaitGroup, resultPixels chan<- []uint32, weights []int) {
	defer wg.Done()

	var matrix []uint32

	for filePath := range filePathChannel {
		if len(filePath) == 0 {
			continue
		}
		// The file ends with %5d.jpg, we need to get the number from the file name as the file index
		fileIndex := filePath[len(filePath)-9 : len(filePath)-4]
		// Replace the leading zeros
		for fileIndex[0] == '0' {
			fileIndex = fileIndex[1:]
		}
		// Now we need to convert the file index to an integer
		fileIndexNum, err := strconv.Atoi(fileIndex)

		w := weights[fileIndexNum-1]

		file, err := os.Open(filePath)
		if err != nil {
			log.Fatal(err)
		}

		img, err := jpeg.Decode(file)
		if err != nil {
			log.Fatal(err)
		}

		bounds := img.Bounds()
		width, height := bounds.Dx(), bounds.Dy()

		if len(matrix) == 0 {
			matrix = make([]uint32, 4*width*height)
		}

		for pixelIndex, pixelValue := range getJPEGPixel(img) {
			matrix[pixelIndex] += uint32(pixelValue) * uint32(w)
		}

		file.Close()
	}
	resultPixels <- matrix
}

func getJPEGPixel(img image.Image) []uint8 {
	if cimg, ok := img.(*image.RGBA); ok {
		return cimg.Pix
	}

	b := img.Bounds()
	dst := image.NewRGBA(b)
	draw.Draw(dst, b, img, b.Min, draw.Src)
	return dst.Pix
}
