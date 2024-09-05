import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { AmqpClientService } from "../amqp-client/amqp-client.service";
import { DATABASE } from "../database/database.provider";
import * as schema from "../database/schema";
import { EnvService } from "../env/env.service";
import {
	MinioClientService,
	UnsupportedMimeType,
} from "../minio-client/minio-client.service";
import { CreateProjectDto } from "./dto/CreateProject.dto";
import { UpdateMetaDto } from "./dto/UpdateMeta.dto";

@Injectable()
export class ProjectsService {
	constructor(
		private readonly minioClientService: MinioClientService,
		private readonly amqpClientService: AmqpClientService,
		private readonly envService: EnvService,
		@Inject(DATABASE) private readonly db: LibSQLDatabase<typeof schema>,
	) {}

	public async getAllProjects() {
		return this.db
			.select({
				id: schema.Projects.id,
				bucketPrefix: schema.Projects.bucketPrefix,
				name: schema.Projects.name,
				isPublic: schema.Projects.isPublic,
				maxWidth: schema.Projects.maxWidth,
				maxHeight: schema.Projects.maxHeight,
				maxFrameRate: schema.Projects.maxFrameRate,
				duration: schema.Projects.duration,
				processingJob: {
					id: schema.ProcessingJobs.id,
					type: schema.ProcessingJobs.type,
					status: schema.ProcessingJobs.status,
					totalSteps: schema.ProcessingJobs.totalSteps,
					currentStep: schema.ProcessingJobs.currentStep,
					stepTimestamps: schema.ProcessingJobs.stepTimestamps,
				},
				imageStackNames: sql<string>`GROUP_CONCAT(DISTINCT ${schema.ImageStacks.name})`,
				totalStackCount: sql`COUNT(DISTINCT ${schema.ImageStacks.id})`,
				totalResultCount: sql`COUNT(DISTINCT ${schema.ResultImages.id})`,
			})
			.from(schema.Projects)
			.leftJoin(
				schema.ProcessingJobs,
				eq(schema.Projects.processingJobId, schema.ProcessingJobs.id),
			)
			.leftJoin(
				schema.ImageStacks,
				eq(schema.Projects.id, schema.ImageStacks.projectId),
			)
			.leftJoin(
				schema.ResultImages,
				eq(schema.ImageStacks.id, schema.ResultImages.imageStackId),
			)
			.groupBy(schema.Projects.id)
			.then((res) =>
				Promise.all(
					res.map(async (project) => ({
						...project,
						memoryUsage:
							await this.minioClientService.getCompleteMemoryUsageInGB(
								project.bucketPrefix,
							),
						imageStackNames: project.imageStackNames?.split(","),
					})),
				),
			);
	}

	public async getProjectById(id: number) {
		const project = await this.db.query.Projects.findFirst({
			where: eq(schema.Projects.id, id),
			with: {
				processingJob: true,
				imageStacks: {
					with: {
						resultImages: true,
					},
				},
			},
		});
		if (!project) {
			throw new HttpException("Project not found", HttpStatus.NOT_FOUND);
		}
		return project;
	}

	public async getProjectNames() {
		return this.db
			.select({
				name: schema.Projects.name,
			})
			.from(schema.Projects)
			.where(
				sql`${schema.Projects.processingJobId} in (select ${schema.ProcessingJobs.id} from ${schema.ProcessingJobs} where ${schema.ProcessingJobs.status} = 'done')`,
			);
	}

	public async deleteProject(id: number) {
		const project = await this.db.query.Projects.findFirst({
			where: eq(schema.Projects.id, id),
			with: {
				processingJob: true,
			},
		});
		if (!project) {
			throw new HttpException("Project not found", HttpStatus.NOT_FOUND);
		}

		await this.minioClientService.deleteFolder(project.bucketPrefix);
		await this.db
			.delete(schema.Projects)
			.where(eq(schema.Projects.id, id))
			.execute();
	}

	public async updateProjectMeta(id: number, body: UpdateMetaDto) {
		await this.db
			.update(schema.Projects)
			.set({
				maxWidth: body.MaxWidth,
				maxHeight: body.MaxHeight,
				maxFrameRate: body.MaxFrameRate,
				duration: body.Duration,
			})
			.where(eq(schema.Projects.id, id))
			.execute();
	}

	public async createProject(
		file: Express.Multer.File,
		createProject: CreateProjectDto,
	) {
		if (await this.minioClientService.isMemoryLimitReached()) {
			throw new HttpException(
				"Memory limit reached",
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const [processingJob] = await this.db
			.insert(schema.ProcessingJobs)
			.values({
				type: "processProject",
			})
			.returning({ id: schema.ProcessingJobs.id });

		const fileEnding = file.originalname.split(".").pop();
		const [project] = await this.db
			.insert(schema.Projects)
			.values({
				processingJobId: processingJob.id,
				name: createProject.name,
				videoFile: `input.${fileEnding}`,
				isPublic: createProject.isPublic,
			})
			.returning();

		const res = await this.minioClientService
			.uploadVideo(file, {
				prefix: project.bucketPrefix as string,
				newName: "input",
			})
			.catch((err) => {
				if (err instanceof UnsupportedMimeType) {
					throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
				}
				throw new HttpException(
					`Error uploading file ${err?.message ?? err}`,
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			});
		if (!res) {
			return;
		}
		await this.amqpClientService.sendMessage("process-project", {
			prefix: project.bucketPrefix,
			videoFile: project.videoFile,
			processingJobId: processingJob.id,
			projectId: project.id,
		});

		return project;
	}

	async getTotalMemory() {
		const totalUsage =
			await this.minioClientService.getCompleteMemoryUsageInGB();
		const maxUsage = this.envService.get("MAX_STORAGE_GB");
		return {
			totalUsage,
			maxUsage,
		};
	}
}
