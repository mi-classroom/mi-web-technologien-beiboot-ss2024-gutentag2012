import {Inject, Injectable} from '@nestjs/common';
import {ClientRMQ, RmqRecordBuilder} from "@nestjs/microservices";
import {ProcessVideoDto} from "../video-processor/dto/ProcessVideo.dto";
import {GenerateImageDto} from "../video-processor/dto/GenerateImage.dto";

@Injectable()
export class AmqpClientService {
  constructor(@Inject("main-queue") private readonly client: ClientRMQ) {
    this.client.connect()
  }

  async sendCreateStackRequest(processVideoDto: ProcessVideoDto) {
    const message = new RmqRecordBuilder()
      .setData(processVideoDto)
      .setOptions({persistent: true})
      .build()
    this.client.emit('create-stack', message)
  }

  public async sendGenerateImageRequest(generateImage: GenerateImageDto) {
    const message = new RmqRecordBuilder()
      .setData(generateImage)
      .setOptions({persistent: true})
      .build()
    this.client.emit('generate-image', message)
  }

  public async sendGenerateThumbnailRequest(project: string, file: string) {
    const message = new RmqRecordBuilder()
      .setData({project, file})
      .setOptions({persistent: true})
      .build()
    this.client.emit('generate-thumbnail', message)
  }
}
