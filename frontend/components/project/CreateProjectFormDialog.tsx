"use client";

import { ErrorText } from "@/components/functional/ErrorText";
import { FileUploadField } from "@/components/functional/FileUploadFIeld";
import {
	generateImageForm,
	isGenerateImageDrawerOpen,
} from "@/components/image/image.signal";
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
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { InputForm } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { getAllProjects } from "@/lib/repos/project.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import {
	Paths,
	ValueAtPath,
	useFormWithComponents,
} from "@formsignals/form-react";
import { useComputed } from "@preact/signals-react";
import { useRouter } from "next/navigation";
import {useEffect} from "react";
import {progressDialogData, updateProgress} from "@/components/functional/ProgressDialog";
import {listenToProgress} from "@/lib/repos/progress.repo";
import {createImageFromStack} from "@/lib/repos/stack.repo";

export function CreateProjectFormDialog() {
	const router = useRouter();
	const form = useFormWithComponents(createProjectForm);
	const fileUpload = useFileUpload(createProjectForm.data.peek().projectFile);

	const isSubmitDisabled = useComputed(
		() =>
			!form.canSubmit.value ||
			fileUpload.isUploading.value ||
			fileUpload.isFileUploaded.value,
	);

	useEffect(() => {
		form.updateOptions({
			defaultValues: {
				projectFile: null as File | null,
				prefix: "",
			},
			onSubmit: async values => {
				progressDialogData.value = {
					CurrentStep: 0,
					MaxSteps: 0,
					Message: "Waiting for server...",
					options: {
						label: "Project Creation",
						description:
							"Currently processing video file and creating project.",
					},
				};

				return new Promise((r) => {
					listenToProgress("generate-thumbnail", values.prefix, (data) => {
						updateProgress(data);
						if (data.CurrentStep !== data.MaxSteps) return;
						serverRevalidateTag("projects");
						r(undefined);
					}).then(async () => {
						await fileUpload.uploadFile([
							["prefix", values.prefix],
							["newName", "input"],
						]);

						isCreateProjectDrawerOpen.value = false;
						await form.reset();
					});
				})
			}
		})
	}, [form, isCreateProjectDrawerOpen, fileUpload.uploadFile]);

	return (
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
						void form.handleSubmit()
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
								if (v.length < 5)
									return "The project name needs to be at least 5 characters long!";
								if (v.includes("/"))
									return "The project name may not include a '/'!";
								if (v.includes(" "))
									return "The project name may not include a space!";
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

						<div>
							<Label className="mb-2 inline-block">Project Video File</Label>
							<FileUploadField
								className="rounded"
								file={createProjectForm.data.peek().projectFile}
								shouldPreview
								title="Upload a video file"
								description="Click to select or drag video file here"
							/>
						</div>
					</div>

					<DialogFooter className="mt-4">
						<ButtonSignal type="submit" disabled={isSubmitDisabled}>
							Create Project{fileUpload.progressText}
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
	);
}
