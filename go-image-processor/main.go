package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"log"
	"os"
	"os/exec"
	"strconv"
	"sync"

	"github.com/joho/godotenv"
)

type Changeable interface {
	Set(x, y int, c color.Color)
}

func splitVideoIntoFrames(ffmpegPath string, input string, output string, frameRate int) {
	cmd := exec.Command(ffmpegPath, "-i", input, "-vf", "scale=1600:-1", "-r", strconv.Itoa(frameRate), output)

	var outb bytes.Buffer
	cmd.Stdout = &outb
	cmd.Stderr = &outb

	err := cmd.Run()
	fmt.Println(outb.String())

	if err != nil {
		log.Fatal(err)
	}
}

type Env struct {
	FfmpegPath string
}

func configureEnvs() Env {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	return Env{os.Getenv("FFMPEG_BINARY_PATH")}
}

func main() {
	env := configureEnvs()

	splitVideoIntoFrames(env.FfmpegPath, "../input/rb25.mov", "../output/ffout%3d.png", 20)

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
	outputFiles := outputFilesAll[375:485]
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

			cimg.Set(x, y, color.RGBA{uint8(r), uint8(g), uint8(b), uint8(a)})
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
