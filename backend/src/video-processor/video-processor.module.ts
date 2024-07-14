import { Module } from "@nestjs/common";
import { AmqpClientModule } from "../amqp-client/amqp-client.module";
import { VideoProcessorController } from "./video-processor.controller";
import { VideoProcessorService } from "./video-processor.service";

@Module({
	imports: [AmqpClientModule],
	providers: [VideoProcessorService],
	controllers: [VideoProcessorController],
})
export class VideoProcessorModule {}
