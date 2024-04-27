package main

import (
	"fmt"
	"log"
	"os/exec"
)

func splitVideoIntoFrames(ffmpegPath string, input string, output string, size int) {
	cmd := exec.Command(ffmpegPath, "-i", input, "-vf", fmt.Sprintf("scale=%d:-1", size), "-r", "20", output)
	err := cmd.Run()

	if err != nil {
		log.Fatal(err)
	}
}
