import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { AmqpClientService } from "../amqp-client/amqp-client.service";
import { DATABASE } from "../database/database.provider";
import * as schema from "../database/schema";
import { EnvService } from "../env/env.service";
import { MinioClientService } from "../minio-client/minio-client.service";
import { CreateStackDto } from "./dto/CreateStack.dto";
import { GenerateImageDto } from "./dto/GenerateImage.dto";

@Injectable()
export class StackService {
	constructor(
		private readonly minioClientService: MinioClientService,
		private readonly amqpClientService: AmqpClientService,
		private readonly envService: EnvService,
		@Inject(DATABASE) private readonly db: LibSQLDatabase<typeof schema>,
	) {}

	async getProjectStacks(projectId: number) {
		return this.db
			.select({
				id: schema.ImageStacks.id,
				bucketPrefix: schema.ImageStacks.bucketPrefix,
				name: schema.ImageStacks.name,
				fromTimestamp: schema.ImageStacks.fromTimestamp,
				toTimestamp: schema.ImageStacks.toTimestamp,
				frameRate: schema.ImageStacks.frameRate,
				scale: schema.ImageStacks.scale,
				totalResultCount: sql`COUNT(DISTINCT ${schema.ResultImages.id})`,
			})
			.from(schema.ImageStacks)
			.leftJoin(
				schema.ResultImages,
				eq(schema.ImageStacks.id, schema.ResultImages.imageStackId),
			)
			.groupBy(schema.ImageStacks.id)
			.where(eq(schema.ImageStacks.projectId, projectId));
	}

	async getAvailableStacks() {
		return this.db
			.select({
				id: schema.ImageStacks.id,
				projectId: schema.ImageStacks.projectId,
				name: schema.ImageStacks.name,
				project: schema.Projects.name,
				projectPrefix: schema.Projects.bucketPrefix,
				stackPrefix: schema.ImageStacks.bucketPrefix,
				fromTimestamp: schema.ImageStacks.fromTimestamp,
				toTimestamp: schema.ImageStacks.toTimestamp,
				frameRate: schema.ImageStacks.frameRate,
				duration: schema.Projects.duration,
			})
			.from(schema.ImageStacks)
			.leftJoin(
				schema.Projects,
				eq(schema.ImageStacks.projectId, schema.Projects.id),
			)
			.where(
				sql`${schema.ImageStacks.processingJobId} in (select id from processing_jobs where status = 'done')`,
			);
	}

	async getStack(stackId: number) {
		const stack = await this.db.query.ImageStacks.findFirst({
			where: eq(schema.ImageStacks.id, stackId),
			with: {
				project: true,
			},
		});
		if (!stack || !stack.project) {
			throw new HttpException("Stack not found", HttpStatus.NOT_FOUND);
		}
		// Get all stack files from minio
		const files = await this.minioClientService
			.listFiles(`${stack.project.bucketPrefix}/${stack.bucketPrefix}`, true)
			.then((res) =>
				res.filter((file) => !file.prefix).map((file) => file.name),
			);

		return {
			...stack,
			frameCount: files.length,
			files,
		};
	}

	async generateImageForStack(stackId: number, data: GenerateImageDto) {
		if (await this.minioClientService.isMemoryLimitReached()) {
			throw new HttpException(
				"Memory limit reached",
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const stack = await this.db.query.ImageStacks.findFirst({
			where: eq(schema.ImageStacks.id, stackId),
			with: {
				project: true,
			},
		});
		if (!stack || !stack.project) {
			throw new HttpException("Stack not found", HttpStatus.NOT_FOUND);
		}

		const [processingJob] = await this.db
			.insert(schema.ProcessingJobs)
			.values({
				type: "generateImage",
			})
			.returning({ id: schema.ProcessingJobs.id });
		const outFilename = randomUUID();

		const [resultImage] = await this.db
			.insert(schema.ResultImages)
			.values({
				filename: `${outFilename}.jpg`,
				frames: data.frames,
				weights: data.weights,
				imageStackId: stackId,
				processingJobId: processingJob.id,
			})
			.returning();

		await this.amqpClientService.sendMessage("generate-image", {
			outFilename: outFilename,
			videoFile: stack.project.videoFile,
			projectPrefix: stack.project.bucketPrefix,
			stackPrefix: stack.bucketPrefix,
			frames: data.frames,
			weights: data.weights,
			processingJobId: processingJob.id,
		});

		return resultImage;
	}

	async createStack(data: CreateStackDto) {
		if (await this.minioClientService.isMemoryLimitReached()) {
			throw new HttpException(
				"Memory limit reached",
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const project = await this.db.query.Projects.findFirst({
			where: eq(schema.Projects.id, data.projectId),
		});

		if (!project) {
			throw new HttpException("Project not found", HttpStatus.NOT_FOUND);
		}

		const similarProject = await this.db.query.ImageStacks.findFirst({
			where: sql`${schema.ImageStacks.projectId} = ${data.projectId} AND ${schema.ImageStacks.fromTimestamp} = ${data.from} AND ${schema.ImageStacks.toTimestamp} = ${data.to} AND ${schema.ImageStacks.frameRate} = ${data.frameRate} AND ${schema.ImageStacks.scale} = ${data.scale}`,
		});
		if (similarProject) {
			throw new HttpException(
				"Stack with the same configuration already exists",
				HttpStatus.BAD_REQUEST,
			);
		}

		// Check that the from and to timestamps are less than the project duration
		const from = data.from.split(":").map((v) => Number.parseInt(v));
		const to = data.to.split(":").map((v) => Number.parseInt(v));
		const fromInSeconds =
			from.length === 3 ? from[0] * 3600 + from[1] * 60 + from[2] : 0;
		const toInSeconds =
			to.length === 3
				? to[0] * 3600 + to[1] * 60 + to[2]
				: project.duration ?? 0;
		if (fromInSeconds > (project.duration ?? 0)) {
			throw new HttpException(
				"From timestamp is greater than project duration",
				HttpStatus.BAD_REQUEST,
			);
		}
		if (toInSeconds > (project.duration ?? 0)) {
			throw new HttpException(
				"To timestamp is greater than project duration",
				HttpStatus.BAD_REQUEST,
			);
		}

		// Check that the frames generated is not bigger than the maximum allowed
		const maxAllowedFrames = this.envService.get("MAX_FRAMES_PER_STACK");
		const duration = toInSeconds - fromInSeconds;
		const framesGenerated = Math.floor(duration * data.frameRate);
		if (!framesGenerated) {
			throw new HttpException(
				"This would generate 0 frames",
				HttpStatus.BAD_REQUEST,
			);
		}
		if (framesGenerated > maxAllowedFrames) {
			throw new HttpException(
				`This would generate ${framesGenerated} frames, which is more than the maximum of ${maxAllowedFrames}`,
				HttpStatus.BAD_REQUEST,
			);
		}

		const [processingJob] = await this.db
			.insert(schema.ProcessingJobs)
			.values({
				type: "createStack",
			})
			.returning({ id: schema.ProcessingJobs.id });

		const [stack] = await this.db
			.insert(schema.ImageStacks)
			.values({
				name: data.name,
				fromTimestamp: data.from,
				toTimestamp: data.to,
				frameRate: data.frameRate,
				scale: data.scale,
				projectId: data.projectId,
				processingJobId: processingJob.id,
			})
			.returning();

		await this.amqpClientService.sendMessage("create-stack", {
			videoFile: project.videoFile,
			projectPrefix: project.bucketPrefix,
			stackPrefix: stack.bucketPrefix,
			fromTimestamp: stack.fromTimestamp,
			toTimestamp: stack.toTimestamp,
			frameRate: stack.frameRate,
			scale: stack.scale,
			processingJobId: processingJob.id,
		});

		return stack;
	}

	async deleteStack(id: number) {
		const stack = await this.db.query.ImageStacks.findFirst({
			where: eq(schema.ImageStacks.id, id),
			with: {
				project: true,
			},
		});

		if (!stack || !stack.project) {
			throw new HttpException("Stack not found", HttpStatus.NOT_FOUND);
		}

		await this.db
			.delete(schema.ImageStacks)
			.where(eq(schema.ImageStacks.id, id));
		await this.minioClientService.deleteFolder(
			`${stack.project.bucketPrefix}/${stack.bucketPrefix}`,
		);
	}

	async deleteStackImage(id: number) {
		const image = await this.db.query.ResultImages.findFirst({
			where: eq(schema.ResultImages.id, id),
			with: {
				imageStack: {
					with: {
						project: true,
					},
				},
			},
		});

		if (!image || !image.imageStack || !image.imageStack.project) {
			throw new HttpException("Image not found", HttpStatus.NOT_FOUND);
		}

		await this.db
			.delete(schema.ResultImages)
			.where(eq(schema.ResultImages.id, id));
		await this.minioClientService.deleteFolder(
			`${image.imageStack.project.bucketPrefix}/${image.imageStack.bucketPrefix}/${image.filename}`,
		);
	}
}
