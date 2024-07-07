import { getApiBaseUrl } from "@/lib/env";

export type Project = {
	name: string;
	otherFiles: string[];
	stacks: Stack[];
};

export type Stack = {
	name: string;
	project: string;
	scale: number;
	frameRate: number;
	from: string;
	to: string;
	results: ResultImage[];
};

export type ResultImage = {
	name: string;
	project: string;
	stack: string;
	frames: number[];
	lastModified?: number;
};

export async function getAllProjects(): Promise<Array<Project>> {
	return fetch(`${getApiBaseUrl()}/projects`, { next: { tags: ["projects"] } })
		.then((res) => res.json())
		.catch((e) => {
			console.error(e);
			return [];
		});
}
