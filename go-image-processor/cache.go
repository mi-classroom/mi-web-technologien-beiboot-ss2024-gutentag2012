package main

import (
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func getCachedPath(tmpPath string) string {
	pathToCacheWithType := strings.Replace(tmpPath, "/tmp/", "/tmp/cache/", 1)

	// Remove the part after cache/ e.g. /tmp/cache/stacks/stack1/stack1.zip -> /tmp/cache/stack1/stack1.zip
	pathsToCache := strings.Split(pathToCacheWithType, "/")

	indexOfAfterCache := -1
	for i, part := range pathsToCache {
		if part == "cache" {
			indexOfAfterCache = i + 1
			break
		}
	}
	if indexOfAfterCache == -1 {
		return tmpPath
	}

	pathsToCache = append(pathsToCache[:indexOfAfterCache], pathsToCache[indexOfAfterCache+1:]...)
	pathToCache := strings.Join(pathsToCache, "/")

	return pathToCache
}

func isCached(path string) bool {
	_, err := os.Stat(path)
	// There is a cached local file
	return err == nil
}

func clearLeastRecentlyUsedCache(env Env) {
	cacheDir := "./tmp/cache"
	files, err := os.ReadDir(cacheDir)
	if err != nil {
		return
	}

	// This is a directory of the cached projects and the maximum last access time of the nested files
	projectDirectories := map[string]int64{}
	for _, file := range files {
		projectDirectories[file.Name()] = 0
		// Walk all the files in the project directory
		err = filepath.Walk(cacheDir+"/"+file.Name(), func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			modTime := info.ModTime().Unix()
			if modTime > projectDirectories[file.Name()] {
				projectDirectories[file.Name()] = modTime
			}
			return nil
		})
		if err != nil {
			continue
		}
	}

	// Get all project names and sort them by last access time
	projectNames := []string{}
	for projectName := range projectDirectories {
		projectNames = append(projectNames, projectName)
	}
	sort.Slice(projectNames, func(i, j int) bool {
		return projectDirectories[projectNames[i]] < projectDirectories[projectNames[j]]
	})

	// Remove the least recently used projects until the cache size is reached
	for isCacheSizeReached(env) {
		if len(projectNames) == 0 {
			break
		}

		projectName := projectNames[0]
		err = os.RemoveAll(cacheDir + "/" + projectName)
		if err != nil {
			break
		}
		projectNames = projectNames[1:]
	}
}

func isCacheSizeReached(env Env) bool {
	cacheDir := "./tmp/cache"
	var size int64
	err := filepath.Walk(cacheDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		size += info.Size()
		return nil
	})
	if err != nil {
		return false
	}
	allowedBytes := env.CacheSizeGB * 1024 * 1024 * 1024
	percentageFilled := float64(size) / float64(allowedBytes) * 100
	log.Println("Cache filled:", percentageFilled, "%")
	return size > allowedBytes
}
