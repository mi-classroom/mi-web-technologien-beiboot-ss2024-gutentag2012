import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Put,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { EnvService } from "../env/env.service";
import { StackService } from "../stack/stack.service";
import { CreateProjectDto } from "./dto/CreateProject.dto";
import { UpdateMetaDto } from "./dto/UpdateMeta.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
	constructor(
		private readonly projectsService: ProjectsService,
		private readonly stacksService: StackService,
		private readonly envService: EnvService,
	) {}

	@Get("total-memory")
	async getTotalMemory() {
		return this.projectsService.getTotalMemory();
	}

	@Get("/")
	async getAllProjects() {
		return this.projectsService.getAllProjects();
	}

	@Get("/names")
	async getProjectNames() {
		return this.projectsService.getProjectNames();
	}

	@Post()
	@UseInterceptors(FileInterceptor("video"))
	async createProject(
		@UploadedFile() file: Express.Multer.File,
		@Body() body: CreateProjectDto,
	) {
		if (!file) {
			throw new HttpException("No file uploaded", HttpStatus.BAD_REQUEST);
		}
		if (file.size > this.envService.get("MAX_FILE_SIZE")) {
			throw new HttpException("File is too large", HttpStatus.BAD_REQUEST);
		}
		return this.projectsService.createProject(file, body);
	}

	@Get("/:id")
	async getProjectById(@Param("id") id: number) {
		return this.projectsService.getProjectById(id);
	}

	@Get("/:id/stacks")
	async getProjectStacks(@Param("id") id: number) {
		return this.stacksService.getProjectStacks(id);
	}

	@Delete(":id")
	async deleteProject(@Param("id") id: number) {
		return this.projectsService.deleteProject(id);
	}

	@Put(":id/meta")
	async updateProjectMeta(
		@Param("id") id: number,
		@Body() body: UpdateMetaDto,
	) {
		return this.projectsService.updateProjectMeta(id, body);
	}
}
