import { Module } from "@nestjs/common";
import { AmqpClientModule } from "../amqp-client/amqp-client.module";
import { MinioClientModule } from "../minio-client/minio-client.module";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";

@Module({
	imports: [MinioClientModule],
	controllers: [FileUploadController],
	providers: [FileUploadService],
	exports: [FileUploadService],
})
export class FileUploadModule {}
