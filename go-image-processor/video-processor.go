package main

import (
	"fmt"
	"log"
	"os/exec"
)

func splitVideoIntoFrames(ffmpegPath string, input string, output string, size int, frameRate int) {
	if size == -1 {
		size = 1600
	}
	if frameRate == -1 {
		frameRate = 20
	}
	cmd := exec.Command(ffmpegPath, "-i", input, "-vf", fmt.Sprintf("scale=%d:-1", size), "-r", fmt.Sprintf("%d", frameRate), output)
	err := cmd.Run()

	if err != nil {
		log.Fatal(err)
	}
}
