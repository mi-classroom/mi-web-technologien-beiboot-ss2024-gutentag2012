import {Inject, Injectable} from '@nestjs/common';
import {Client, ClientProxy, ClientRMQ, RmqRecordBuilder} from "@nestjs/microservices";
import {AMPQ_VIDEO_PROCESSING} from "./amqp-client.constants";
import {EnvService} from "../env/env.service";
import {ProcessVideoDto} from "../video-processor/dto/ProcessVideo.dto";

@Injectable()
export class AmqpClientService {
  constructor(@Inject(AMPQ_VIDEO_PROCESSING) private readonly client: ClientRMQ, envService: EnvService) {
    this.client.connect()
  }

  async sendVideoProcessingRequest(processVideoDto: ProcessVideoDto) {
    const message = new RmqRecordBuilder()
      .setData(processVideoDto)
      .setOptions({persistent: true})
      .build()
    this.client.emit('video-processing', message)
  }
}
