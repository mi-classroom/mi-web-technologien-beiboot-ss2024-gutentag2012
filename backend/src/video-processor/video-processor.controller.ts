import {Body, Controller, Post} from '@nestjs/common';
import {ProcessVideoDto} from "./dto/ProcessVideo.dto";
import {VideoProcessorService} from "./video-processor.service";

@Controller('video-processor')
export class VideoProcessorController {
  constructor(private readonly videoProcessorService: VideoProcessorService) {
  }
  @Post()
  processVideo(@Body() processVideo: ProcessVideoDto) {
    return this.videoProcessorService.processVideo(processVideo)
  }
}
