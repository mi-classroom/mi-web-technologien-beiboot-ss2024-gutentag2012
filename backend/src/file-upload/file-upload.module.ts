import { Module } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';
import {MinioClientModule} from "../minio-client/minio-client.module";
import {AmqpClientModule} from "../amqp-client/amqp-client.module";

@Module({
  imports: [MinioClientModule, AmqpClientModule],
  controllers: [FileUploadController],
  providers: [FileUploadService]
})
export class FileUploadModule {}
