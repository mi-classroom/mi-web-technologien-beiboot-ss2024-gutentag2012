package main

import (
	"fmt"
	"os/exec"
)

func splitVideoIntoFrames(ffmpegPath string, input string, output string, size int, frameRate int, fromTime string, toTime string) error {
	if size == -1 {
		size = 1600
	}
	if frameRate == -1 {
		frameRate = 20
	}

	args := []string{
		"-i", input,
		"-vf", fmt.Sprintf("scale=%d:-1", size),
		"-r", fmt.Sprintf("%d", frameRate),
	}

	if fromTime != "" {
		args = append(args, "-ss", fromTime)
	}

	if toTime != "" {
		args = append(args, "-to", toTime)
	}

	args = append(args, output)

	cmd := exec.Command(ffmpegPath, args...)
	return cmd.Run()
}
