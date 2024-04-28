import { Module } from '@nestjs/common';
import { VideoProcessorService } from './video-processor.service';
import { VideoProcessorController } from './video-processor.controller';
import {AmqpClientModule} from "../amqp-client/amqp-client.module";

@Module({
  imports: [AmqpClientModule],
  providers: [VideoProcessorService],
  controllers: [VideoProcessorController]
})
export class VideoProcessorModule {}
