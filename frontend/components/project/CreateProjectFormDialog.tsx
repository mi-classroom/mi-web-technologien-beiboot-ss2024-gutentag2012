"use client";

import { ErrorText } from "@/components/functional/ErrorText";
import { FileUploadField } from "@/components/functional/FileUploadFIeld";
import { useProgressDialog } from "@/components/functional/ProgressDialog";
import {
	createProjectForm,
	isCreateProjectDrawerOpen,
} from "@/components/project/project.signals";
import { Button, ButtonSignal } from "@/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogSignal,
	DialogTitle,
} from "@/components/ui/dialog";
import { DrawerClose } from "@/components/ui/drawer";
import { InputForm } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject } from "@/lib/hooks/useCreateProject";
import { listenToJob } from "@/lib/repos/jobs.repo";
import { getAllProjects } from "@/lib/repos/project.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { useFormWithComponents } from "@formsignals/form-react";
import { useComputed } from "@preact/signals-react";
import { useEffect } from "react";

export function CreateProjectFormDialog() {
	const form = useFormWithComponents(createProjectForm);
	const projectCreator = useCreateProject(
		createProjectForm.data.peek().projectFile,
	);

	const progress = useProgressDialog({
		label: "Project Creation",
		description: "Currently processing video file and creating project.",
		messages: [
			"Downloading files from server...",
			"Analysing metadata...",
			"Send data to server...",
			"Extracting Thumbnail...",
			"Uploading Thumbnail...",
		],
		pendingMessage: "Connecting to server and creating project...",
	});

	const isSubmitDisabled = useComputed(
		() =>
			!form.canSubmit.value ||
			projectCreator.isUploading.value ||
			projectCreator.isFileUploaded.value,
	);

	useEffect(() => {
		form.updateOptions({
			defaultValues: {
				projectFile: null as File | null,
				prefix: "",
			},
			onSubmit: async (values, addErrors) => {
				progress.isOpen.value = true;
				progress.data.value = {
					status: "queued",
					stepTimestamps: [],
				};

				const createdProject = await projectCreator
					.createProject([
						["name", values.prefix],
						["isPublic", false],
					])
					.catch((err) => {
						progress.isOpen.value = false;
						if (!("message" in err) || typeof err.message !== "string") {
							return;
						}
						addErrors({
							projectFile: err.message,
						});
					});

				if (!createdProject) return;

				return new Promise((r) => {
					listenToJob(createdProject.processingJobId, (data) => {
						progress.data.value = data;

						if (data.status !== "done") return;

						serverRevalidateTag("projects");
						r(undefined);
					}).then(() => {
						isCreateProjectDrawerOpen.value = false;
						form.reset();
					});
				});
			},
		});
	}, [form, projectCreator.createProject, progress]);

	return (
		<>
			<progress.ProgressDialog />
			<DialogSignal
				open={isCreateProjectDrawerOpen}
				onOpenChange={(newOpen) => {
					isCreateProjectDrawerOpen.value = newOpen;
					if (!newOpen) createProjectForm.reset();
				}}
			>
				<DialogContent className="max-w-3xl">
					<form
						onSubmit={async (e) => {
							e.preventDefault();
							void form.handleSubmit();
						}}
					>
						<DialogHeader>
							<DialogTitle>Create new Project</DialogTitle>
							<DialogDescription>
								Here you can upload a video file to create a new Project.
							</DialogDescription>
						</DialogHeader>

						<div className="mt-2 flex flex-col gap-1">
							<form.FieldProvider
								name="prefix"
								validator={(v) => {
									if (!v) return "This field is required!";
									if (v.length < 3)
										return "The project name needs to be at least 3 characters long!";
								}}
								validatorAsync={async (value) => {
									const projects = await getAllProjects();
									const nameTaken = projects.some(
										(project) => project.name === value,
									);
									if (nameTaken) return "This project name is already taken!";
								}}
								validatorAsyncOptions={{
									disableOnChangeValidation: true,
								}}
							>
								<div>
									<Label className="mb-2 inline-block">Project Name</Label>
									<InputForm type="text" placeholder="Type here..." />
									<ErrorText />
								</div>
							</form.FieldProvider>

							<form.FieldProvider
								name="projectFile"
								validator={(file) => {
									if (!file) return "Please upload a file";
									if (file.size > Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE))
										return "File is too large";
									return undefined;
								}}
							>
								<div>
									<Label className="mb-2 inline-block">
										Project Video File
									</Label>
									<FileUploadField
										className="rounded"
										file={createProjectForm.data.peek().projectFile}
										shouldPreview
										title="Upload a video file"
										description="Click to select or drag video file here"
									/>
									<ErrorText />
								</div>
							</form.FieldProvider>
						</div>

						<DialogFooter className="mt-4">
							<ButtonSignal type="submit" disabled={isSubmitDisabled}>
								Create Project{projectCreator.progressText}
							</ButtonSignal>
							<DrawerClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DrawerClose>
						</DialogFooter>
					</form>
				</DialogContent>
			</DialogSignal>
		</>
	);
}
