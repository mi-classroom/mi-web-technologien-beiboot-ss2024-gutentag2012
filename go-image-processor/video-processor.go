package main

import (
	"fmt"
	"log"
	"os/exec"
)

func splitVideoIntoFrames(ffmpegPath string, input string, output string, size int) {
	if size == -1 {
		size = 1600
	}
	cmd := exec.Command(ffmpegPath, "-i", input, "-vf", fmt.Sprintf("scale=%d:-1", size), "-r", "20", output)
	err := cmd.Run()

	if err != nil {
		log.Fatal(err)
	}
}
