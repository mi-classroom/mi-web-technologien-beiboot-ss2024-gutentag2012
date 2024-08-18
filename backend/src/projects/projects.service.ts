import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	NotImplementedException,
} from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { AmqpClientService } from "../amqp-client/amqp-client.service";
import { DATABASE } from "../database/database.provider";
import * as schema from "../database/schema";
import { isJobProcessing } from "../jobs/jobs.utils";
import {
	MinioClientService,
	UnsupportedMimeType,
} from "../minio-client/minio-client.service";
import { onlyFulfilledPromises } from "../promise.utils";
import { CreateProjectDto } from "./dto/CreateProject.dto";
import { UpdateMetaDto } from "./dto/UpdateMeta.dto";
import {
	getResultImageFromName,
	getStackFromStackName,
} from "./projects.utils";

@Injectable()
export class ProjectsService {
	constructor(
		private readonly minioClientService: MinioClientService,
		private readonly amqpClientService: AmqpClientService,
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
				res.map((project) => ({
					...project,
					imageStackNames: project.imageStackNames.split(","),
				})),
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
		if (project.processingJob && isJobProcessing(project.processingJob)) {
			throw new HttpException(
				"Cannot delete project while processing",
				HttpStatus.BAD_REQUEST,
			);
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

	public async getAllProjectss() {
		const rootFiles = await this.minioClientService.listFiles("root");

		const projectPromises = rootFiles
			.filter((file) => file.prefix)
			.map(async (projectFile) => {
				if (!projectFile.prefix) return null;
				const projectName = projectFile.prefix.replace(/\/$/, "");
				const [stacks, otherFiles] =
					await this.getStacksForProject(projectName);

				return {
					name: projectName,
					stacks,
					otherFiles,
				};
			});

		return onlyFulfilledPromises(projectPromises);
	}

	public async getStacksForProject(projectName: string) {
		const projectEntries = await this.minioClientService.listFiles(
			`${projectName}/`,
			false,
		);

		const stackPromises = projectEntries
			.filter((projectEntry) => projectEntry.prefix)
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			.map((projectEntry) => getStackFromStackName(projectEntry.prefix!))
			.map(async (stack) => {
				const results = await this.getStackResultsForStack(
					projectName,
					stack.name,
				);
				return {
					...stack,
					results,
				};
			});

		return [
			await onlyFulfilledPromises(stackPromises),
			projectEntries.filter((file) => !file.prefix).map((file) => file.name),
		] as const;
	}

	private async getStackResultsForStack(
		projectName: string,
		stackName: string,
	) {
		const stackEntries = await this.minioClientService.listFiles(
			`${projectName}/${stackName}/outputs/`,
			false,
		);
		return stackEntries
			.filter((e) => e.name)
			.map((e) =>
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				getResultImageFromName(e.name!, e.lastModified),
			);
	}
}
