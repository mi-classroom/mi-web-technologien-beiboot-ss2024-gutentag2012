import {Body, Controller, Post} from '@nestjs/common';
import {ProcessVideoDto} from "./dto/ProcessVideo.dto";
import {VideoProcessorService} from "./video-processor.service";
import {GenerateImageDto} from "./dto/GenerateImage.dto";

@Controller('video-processor')
export class VideoProcessorController {
  constructor(private readonly videoProcessorService: VideoProcessorService) {
  }
  @Post("stack")
  createStack(@Body() processVideo: ProcessVideoDto) {
    return this.videoProcessorService.createStack(processVideo)
  }
  @Post("generate")
  generateImage(@Body() generateImage: GenerateImageDto) {
    return this.videoProcessorService.generateImage(generateImage)
  }
}
