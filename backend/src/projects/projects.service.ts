import { Injectable } from "@nestjs/common";
import { MinioClientService } from "../minio-client/minio-client.service";
import { onlyFulfilledPromises } from "../promise.utils";
import {
	getResultImageFromName,
	getStackFromStackName,
} from "./projects.utils";

@Injectable()
export class ProjectsService {
	constructor(private readonly minioClientService: MinioClientService) {}

	public async getAllProjects() {
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
