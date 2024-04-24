package main

import (
	"bytes"
	"fmt"
	"image/color"
	"image/png"
	"log"
	"os"
	"os/exec"
	"strconv"
	"sync"
)

type Changeable interface {
	Set(x, y int, c color.Color)
}

type MyColor struct {
	r uint32
	g uint32
	b uint32
	a uint32
}

func (color *MyColor) FromRGBA(r uint32, g uint32, b uint32, a uint32) {
	color.r = r
	color.g = g
	color.b = b
	color.a = a
}

func (color *MyColor) RGBA() (uint32, uint32, uint32, uint32) {
	return color.r, color.g, color.b, color.a
}

func splitVideoIntoFrames(input string, output string, frameRate int) {
	cmd := exec.Command("..\\ffmpeg\\bin\\ffmpeg", "-i", input, "-vf", "scale=1600:-1", "-r", strconv.Itoa(frameRate), output)

	var outb bytes.Buffer
	cmd.Stdout = &outb
	cmd.Stderr = &outb

	err := cmd.Run()
	fmt.Println(outb.String())

	if err != nil {
		log.Fatal(err)
	}
}

// TODO Add Readme to ffmpeg folder, so that a user knows they have to install the binary on their own, ignore
// TODO Use exe for windows or other script for linux or mac
// TODO Use ENV for path to ffmpeg to also allow for global installation to work

func main() {
	splitVideoIntoFrames("../input/rb25.mov", "../output/ffout%3d.png", 20)

	// Define the directory you want to process
	dir := "../output"

	// Channel to communicate file paths to workers
	filePaths := make(chan string)

	// Number of workers (goroutines)
	numWorkers := 20

	resultPixels := make(chan []uint32, numWorkers)

	// WaitGroup to synchronize the workers
	var wg sync.WaitGroup
	wg.Add(numWorkers)

	// Launch workers
	for i := 0; i < numWorkers; i++ {
		go worker(filePaths, &wg, resultPixels)
	}

	outputFilesAll, err := os.ReadDir(dir)
	if err != nil {
		log.Fatal(err)
	}
	outputFiles := outputFilesAll[475:485]
	for _, outputFile := range outputFiles {
		filePaths <- outputFile.Name()
	}
	// Close the channel once all files are processed
	close(filePaths)

	firstImageFile, err := os.Open("../output/" + outputFiles[0].Name())
	if err != nil {
		log.Fatal(err)
	}
	defer firstImageFile.Close()

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

			color := &MyColor{}
			color.FromRGBA(r, g, b, a)
			cimg.Set(x, y, color)
		}

		outFile, err := os.Create("../merged.png")
		if err != nil {
			log.Fatal(err)
		}

		png.Encode(outFile, finalImage)

		fmt.Println("Done")
	} else {
		log.Fatal("Image could not be written to")
	}
}

func worker(filePaths <-chan string, wg *sync.WaitGroup, resultPixels chan<- []uint32) {
	defer wg.Done()

	var matrix []uint32

	for filePath := range filePaths {
		file, err := os.Open("../output/" + filePath)
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

		for x := 0; x < width; x++ {
			for y := 0; y < height; y++ {
				r, g, b, a := img.At(x, y).RGBA()
				startIndex := (x * 4) + (y * width * 4)

				matrix[startIndex] += r
				matrix[startIndex+1] += g
				matrix[startIndex+2] += b
				matrix[startIndex+3] += a
			}
		}

		file.Close()
	}
	resultPixels <- matrix
}
