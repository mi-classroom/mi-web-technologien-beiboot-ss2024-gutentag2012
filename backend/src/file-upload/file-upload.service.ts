import { Injectable } from "@nestjs/common";
import { AmqpClientService } from "../amqp-client/amqp-client.service";
import { MinioClientService } from "../minio-client/minio-client.service";

@Injectable()
export class FileUploadService {
	constructor(private readonly minioClientService: MinioClientService) {}

	public async getFile(filename: string) {
		return this.minioClientService.getFile(filename);
	}

	public async getFileStats(filename: string) {
		return this.minioClientService.getFileStats(filename);
	}

	public async getPartialFile(filename: string, start: number, end: number) {
		return this.minioClientService.getPartialFile(filename, start, end);
	}

	public async listFiles(folder: string) {
		return this.minioClientService
			.listFiles(folder, false)
			.then((res) => res.filter((file) => !file.prefix));
	}

	public async fileExists(filename: string) {
		return this.minioClientService.fileExists(filename);
	}
}
