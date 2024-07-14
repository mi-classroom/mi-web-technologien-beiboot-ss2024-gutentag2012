"use client";

import { FileUploadField } from "@/components/functional/FileUploadFIeld";
import {
	createProjectForm,
	isCreateProjectDrawerOpen,
} from "@/components/project/project.signals";

export function CreateProjectListItem() {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			className="bg-card text-card-foreground rounded-lg h-64"
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				isCreateProjectDrawerOpen.value = true;
			}}
		>
			<FileUploadField
				file={createProjectForm.data.peek().projectFile}
				className="rounded-lg bg-transparent"
				title="Create new Project"
				description="Click to open or drag video file here"
				onChange={(file) => {
					createProjectForm.data.peek().projectFile.value = file;
					isCreateProjectDrawerOpen.value = true;
				}}
			/>
		</div>
	);
}
