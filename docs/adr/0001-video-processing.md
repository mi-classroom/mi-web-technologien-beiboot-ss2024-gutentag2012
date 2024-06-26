# Video Processing for Frame Extraction

|          |                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------- |
| status   | Accepted |
| date     | 2024-04-28                                                      |
| deciders | [Joshua Gawenda](https://github.com/gutentag2012)                                                    |

## Context and Problem Statement

In order to create a long term exposure picture from a video a tool is needed to extract the video frames.

## Decision Drivers

* How long does it take to implement?
* How easy is it to integrate into the application?
* Can this be deployed?
* How performant is it?

## Considered Options

* FFMPEG
* Create custom video processor

## Decision Outcome

Chosen option: "FFMPEG", because it is the industry standard and as far as the research show the only viable option. Creating a custom video processor is not an option since it takes too much time and would be hard to maintain.

## Pros and Cons of the Options

### FFMPEG

It is a programm created for various operations on videos which include but are not limited to the extraction of video frames.

* Good, because it does extract the frames of a video
* Neutral, because it is a binary that has to be shipped with the deployment
* Neutral, because it is restricted to the usage over the command line
* Bad, because integration is limited to the implemented features and configuration options
* Bad, because performance cannot be optimized directly

### Custom video processor

This option would have been to implement a custom video processor with the sole purpose of extracting video frames.

* Good, because it is fine tuned to the exact operations needed
* Good, because the performance can be optimized where needed
* Neutral, because it can be shipped with the application
* Bad, because it is extremely complicated to work with video encodeing
* Bad, because it has to be maintained with the rest of the project
* Bad, because it takes a lot of time and resources to implement a custom solution
