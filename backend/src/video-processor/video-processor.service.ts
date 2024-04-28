import { Injectable } from '@nestjs/common';
import {AmqpClientService} from "../amqp-client/amqp-client.service";
import {ProcessVideoDto} from "./dto/ProcessVideo.dto";

@Injectable()
export class VideoProcessorService {
  constructor(private readonly amqpClientService: AmqpClientService) {
  }

  public async processVideo(processVideoDto: ProcessVideoDto) {
    return this.amqpClientService.sendVideoProcessingRequest(processVideoDto)
  }
}
