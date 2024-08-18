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

func splitThumbnailFromVideo(ffmpegPath string, input string, output string) error {
	args := []string{
		"-i", input,
		"-vframes", "1",
		"-an",
		"-ss", "00:00:01",
		"-vf", "scale=640:-1",
	}

	args = append(args, output)

	cmd := exec.Command(ffmpegPath, args...)
	return cmd.Run()
}

type VideoMeta struct {
	MaxWidth int
	MaxHeight int
	MaxFrameRate int
	Duration    int
}

func getVideoMetaData(ffprobePath string, input string) (VideoMeta, error) {
	args := []string{
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height,r_frame_rate,duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		input,
	}

	cmd := exec.Command(ffprobePath, args...)
	out, err := cmd.Output()
	if err != nil {
		return VideoMeta{}, err
	}

	var width, height, frameRateNumerator, frameRateDenominator, duration int
	_, err = fmt.Sscanf(string(out), "%d\n%d\n%d/%d\n%d", &width, &height, &frameRateNumerator, &frameRateDenominator, &duration)
	if err != nil {
		return VideoMeta{}, err
	}

	return VideoMeta{
		MaxWidth:     width,
		MaxHeight:    height,
		MaxFrameRate: (frameRateNumerator / frameRateDenominator) + 1,
		Duration:     duration,
	}, nil
}
