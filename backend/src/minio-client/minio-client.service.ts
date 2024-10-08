import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { Injectable } from "@nestjs/common";
import { MinioService } from "nestjs-minio-client";
import { EnvService } from "../env/env.service";

type BucketItem = {
	name?: string;
	lastModified?: Date;
	size: number;
	prefix?: string;
};

@Injectable()
export class MinioClientService {
	private readonly minioEndpoint: string;
	private readonly minioPort: number;
	private readonly minioBucket: string;

	constructor(
		private readonly minio: MinioService,
		private readonly envService: EnvService,
	) {
		this.minioEndpoint = this.envService.get("MINIO_ENDPOINT");
		this.minioPort = this.envService.get("MINIO_PORT");
		this.minioBucket = this.envService.get("MINIO_BUCKET_NAME");
	}

	public async getFile(filename: string) {
		return this.minio.client.getObject(this.minioBucket, filename);
	}

	public async getFileStats(filename: string): Promise<{
		size: number;
		lastModified: Date;
	}> {
		return this.minio.client.statObject(this.minioBucket, filename);
	}

	public async getPartialFile(filename: string, start: number, end: number) {
		return this.minio.client.getPartialObject(
			this.minioBucket,
			filename,
			start,
			end - start + 1,
		);
	}

	public async listFiles(folder: string, recursive = false) {
		const bucketStream = this.minio.client.listObjectsV2(
			this.minioBucket,
			folder === "root" ? "" : folder,
			recursive,
			"/",
		);
		return new Promise<BucketItem[]>((resolve, reject) => {
			const data: BucketItem[] = [];
			bucketStream.on("data", (obj) => {
				data.push({
					prefix: obj.prefix,
					name: obj.name,
					lastModified: obj.lastModified,
					size: obj.size,
				});
			});
			bucketStream.on("error", (err) => {
				reject(err);
			});
			bucketStream.on("end", () => {
				resolve(data);
			});
		});
	}

	public async uploadVideo(
		file: Express.Multer.File,
		options: { prefix?: string; newName?: string },
	) {
		if (!this.isMimeTypeSupported(file.mimetype)) {
			throw new UnsupportedMimeType(`Unsupported mime type ${file.mimetype}`);
		}

		const fileExtension = extname(file.originalname);
		const metaData = {
			"Content-Type": file.mimetype,
		};

		const prefix = options.prefix ? `${options.prefix}/` : "";
		const newName = options.newName
			? options.newName
			: `${randomUUID()}-${Date.now()}`;

		const filename = `${prefix}${newName}${fileExtension}`;
		await this.minio.client.putObject(
			this.minioBucket,
			filename,
			file.buffer,
			file.size,
			metaData,
		);

		return {
			filename,
			url: this.getFileUrl(filename, this.minioBucket),
		};
	}

	private isMimeTypeSupported(mimetype: string): boolean {
		return mimetype.startsWith("video/");
	}

	private getFileUrl(filename: string, bucket: string): string {
		return `${this.minioEndpoint}:${this.minioPort}/${bucket}/${filename}`;
	}

	public async fileExists(filename: string) {
		return this.minio.client
			.statObject(this.minioBucket, filename)
			.then(() => true)
			.catch(() => false);
	}

	public async deleteFolder(folder: string) {
		const files = await this.listFiles(folder, true);
		await this.minio.client.removeObjects(
			this.minioBucket,
			files.map((file) => file.name).filter(Boolean) as string[],
		);
	}

	public async isMemoryLimitReached() {
		const memoryLimit = this.envService.get("MAX_STORAGE_GB");
		const currentMemoryUsage = await this.getCompleteMemoryUsageInGB();
		return currentMemoryUsage >= memoryLimit;
	}

	public async getCompleteMemoryUsageInGB(project = "") {
		const bucketStream = this.minio.client.listObjectsV2(
			this.minioBucket,
			project,
			true,
			"/",
		);
		let totalSize = 0;
		return new Promise<number>((resolve, reject) => {
			bucketStream.on("data", (obj) => {
				totalSize += obj.size;
			});
			bucketStream.on("error", (err) => {
				reject(err);
			});
			bucketStream.on("end", () => {
				resolve(totalSize / (1024 * 1024 * 1024));
			});
		});
	}
}

export class UnsupportedMimeType extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnsupportedMimeType";
	}
}
