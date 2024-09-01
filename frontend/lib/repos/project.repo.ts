import { getServerApiUrl } from "@/lib/env";
import type { FileUploadState } from "@/lib/hooks/useCreateProject";
import { parseXhrResponse } from "@/lib/utils";
import type { Signal } from "@preact/signals-react";

export type Project = {
	id: number;
	bucketPrefix: string;
	name: string;
	isPublic: boolean;
	videoFile: string;

	maxWidth?: number;
	maxHeight?: number;
	maxFrameRate?: number;
	duration?: number;

	processingJob?: {
		id: number;
		type: "createStack" | "generateImage" | "processProject";
		status: "queued" | "processing" | "done" | "error";
		totalSteps: number;
		currentStep: number;
		stepTimestamps: number[];
	};

	imageStackNames: string[];
	totalStackCount: number;
	totalResultCount: number;
};

export type ProjectFull = Omit<
	Project,
	"totalStackCount" | "totalResultCount"
> & {
	imageStacks: Array<{
		id: number;
		bucketPrefix: string;
		name: string;
		fromTimestamp: string;
		toTimestamp: string;
		frameRate: number;
		scale: number;
		resultImages: Array<{
			id: number;
			filename: string;
			frames: number[];
			weights: number[];
		}>;
		totalResultCount: number;
	}>;
};

export type Stack = {
	id: number;
	bucketPrefix: string;
	name: string;
	project: string;
	files: string[];
	frameCount: number;
	fromTimestamp: string;
	toTimestamp: string;
	frameRate: number;
	scale: number;
	totalResultCount: number;
};

export type ResultImage = {
	id: number;
	filename: string;
	project: string;
	stack: string;
	frames: number[];
	lastModified?: number;
};

export async function getAllProjects(): Promise<Array<Project>> {
	return fetch(`${getServerApiUrl()}/projects`, {
		next: { tags: ["projects"] },
	})
		.then((res) => res.json())
		.catch((e) => {
			console.error(e);
			return [];
		});
}

export async function getProjectById(id: string): Promise<ProjectFull> {
	return fetch(`${getServerApiUrl()}/projects/${id}`, {
		next: { tags: ["projects", id] },
	})
		.then((res) => res.json())
		.catch((e) => {
			console.error(e);
			return undefined;
		});
}

export async function deleteProject(id: number) {
	return fetch(`${getServerApiUrl()}/projects/${id}`, {
		method: "DELETE",
	});
}

export async function createProject(
	video: File | null,
	additionalData: Array<[string, unknown]> | undefined,
	status: Signal<FileUploadState>,
) {
	if (!video) return;
	const xhr = new XMLHttpRequest();

	const formData = new FormData();
	formData.append("video", video);

	if (additionalData) {
		for (const [key, value] of additionalData) {
			formData.append(
				key,
				typeof value === "string" ? value : JSON.stringify(value),
			);
		}
	}

	return new Promise<{ processingJobId: number }>((resolve, reject) => {
		xhr.addEventListener("readystatechange", () => {
			if (xhr.readyState !== 4) return;
			const isError = xhr.status >= 400;
			const isNotSuccess = xhr.status >= 300 || xhr.status < 200;

			const response = parseXhrResponse(xhr);
			if (isError || isNotSuccess) {
				status.value = {
					state: "error",
					error: `Failed to upload file: "${response?.message ?? response}"`,
				};
				return reject(response);
			}

			status.value = {
				state: "success",
				data: {
					filename: response.filename,
					originalFilename: video.name,
				},
			};
			resolve({
				processingJobId: response.processingJobId,
			});
		});
		xhr.addEventListener("progress", (e) => {
			status.value = {
				state: "progress",
				progress: e.loaded / e.total,
			};
		});
		xhr.addEventListener("error", () => {
			status.value = {
				state: "error",
				error: `Error uploading file: "${xhr.responseText}"`,
			};
			reject(xhr.responseText);
		});

		xhr.open("POST", `${getServerApiUrl()}/projects`, true);
		xhr.send(formData);
		status.value = {
			state: "progress",
			progress: 0,
		};
	});
}
