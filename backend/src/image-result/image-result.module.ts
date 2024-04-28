import { Module } from '@nestjs/common';
import { ImageResultController } from './image-result.controller';
import { ImageResultService } from './image-result.service';

@Module({
  controllers: [ImageResultController],
  providers: [ImageResultService]
})
export class ImageResultModule {}
