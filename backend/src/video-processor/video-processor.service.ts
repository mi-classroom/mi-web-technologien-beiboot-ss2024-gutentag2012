import { Injectable } from "@nestjs/common";
import { AmqpClientService } from "../amqp-client/amqp-client.service";
import { GenerateImageDto } from "./dto/GenerateImage.dto";
import { ProcessVideoDto } from "./dto/ProcessVideo.dto";

@Injectable()
export class VideoProcessorService {
	constructor(private readonly amqpClientService: AmqpClientService) {}

	public async createStack(processVideoDto: ProcessVideoDto) {
		return this.amqpClientService.sendCreateStackRequest(processVideoDto);
	}

	public async generateImage(generateImage: GenerateImageDto) {
		return this.amqpClientService.sendGenerateImageRequest(generateImage);
	}
}
