import { createProject } from "@/lib/repos/project.repo";
import { type Signal, useComputed, useSignal } from "@preact/signals-react";
import { useCallback } from "react";

type ProgressState = {
	state: "progress";
	progress: number;
};
type SuccessState = {
	state: "success";
	data: {
		filename: string;
		originalFilename: string;
	};
};
type IdleState = {
	state: "idle";
};
type ErrorState = {
	state: "error";
	error: string;
};
export type FileUploadState =
	| ProgressState
	| SuccessState
	| IdleState
	| ErrorState;

export const useCreateProject = (file: Signal<File | null>) => {
	const status = useSignal<FileUploadState>({ state: "idle" });
	const uploadedFile = useSignal<string | undefined>(undefined);

	const isUploading = useComputed(() => status.value.state === "progress");
	const progressText = useComputed(() =>
		status.value.state === "progress"
			? ` ${Math.round(status.value.progress * 100)}%`
			: "",
	);
	const isFileUploaded = useComputed(
		() =>
			status.value.state === "success" &&
			status.value.data.originalFilename === file.value?.name,
	);

	const createProjectFn = useCallback(
		async (additionalData?: Array<[string, unknown]>) => {
			return createProject(file.peek(), additionalData, status);
		},
		[status, file],
	);

	return {
		uploadedFile,
		isUploading,
		createProject: createProjectFn,
		progressText,
		isFileUploaded,
	};
};
