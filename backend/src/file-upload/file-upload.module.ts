import { Module } from "@nestjs/common";
import { AmqpClientModule } from "../amqp-client/amqp-client.module";
import { MinioClientModule } from "../minio-client/minio-client.module";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";

@Module({
	imports: [MinioClientModule, AmqpClientModule],
	controllers: [FileUploadController],
	providers: [FileUploadService],
})
export class FileUploadModule {}
