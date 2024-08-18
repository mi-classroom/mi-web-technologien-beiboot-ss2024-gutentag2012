"use client";

import { ErrorText, ErrorTextForm } from "@/components/functional/ErrorText";
import { useProgressDialog } from "@/components/functional/ProgressDialog";
import {
	createStackForm,
	isCreateStackDrawerOpen,
} from "@/components/stack/stack.signal";
import { Button } from "@/components/ui/button";
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
import {
	SelectContent,
	SelectForm,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { listenToJob } from "@/lib/repos/jobs.repo";
// import { listenToProgress } from "@/lib/repos/progress.repo";
import type { Project } from "@/lib/repos/project.repo";
import { createStack } from "@/lib/repos/stack.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { timeStringToMillis, validateTimeStringLessThan } from "@/lib/utils";
import { useFormWithComponents } from "@formsignals/form-react";
import { ZodAdapter } from "@formsignals/validation-adapter-zod";
import { useComputed } from "@preact/signals-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";

type CreateStackFormDrawerProps = {
	projects: Project[];
};

export function CreateStackFormDialog({
	projects,
}: CreateStackFormDrawerProps) {
	const form = useFormWithComponents(createStackForm);
	const { project } = useParams();
	const selectedProject = useComputed(() =>
		projects.find((p) => p.id === form.data.value.projectId?.value),
	);

	const progress = useProgressDialog({
		label: "Video Processing",
		description:
			"Currently processing project video and extracting frames. Be aware that this might take a while depending on the input.",
		messages: [
			"Downloading files from server...",
			"Splitting video into frames...",
			"Uploading files to server...",
		],
		pendingMessage: "Connecting to server and creating stack...",
	});

	useEffect(() => {
		if (!project) return;
		form.updateOptions({
			validatorAdapter: ZodAdapter,
			defaultValues: {
				projectId: +project,
				scale: 1600,
				name: "",
				from: "",
				to: "",
				frameRate: 30,
			},
			onSubmit: async (values, addErrors) => {
				const stack = await createStack(values).catch((err) => {
					addErrors({
						"": err.message,
					});
				});
				if (!stack) return;

				progress.isOpen.value = true;
				progress.data.value = {
					status: "queued",
					stepTimestamps: [],
				};

				return new Promise((r) => {
					listenToJob(stack.processingJobId, (data) => {
						progress.data.value = data;

						if (data.status !== "done") return;

						serverRevalidateTag("stacks");
						r(undefined);
					}).then(async () => {
						isCreateStackDrawerOpen.value = false;
						await form.reset();
					});
				});
			},
		});
	}, [form, project, progress]);

	return (
		<>
			<progress.ProgressDialog />
			<DialogSignal
				open={isCreateStackDrawerOpen}
				onOpenChange={(newOpen) => {
					isCreateStackDrawerOpen.value = newOpen;
					if (!newOpen) createStackForm.reset();
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
							<DialogTitle>Add new Stack</DialogTitle>
							<DialogDescription>
								Here you can split a project file into several frames.
							</DialogDescription>
						</DialogHeader>

						<div className="mt-4 flex flex-col gap-1">
							<form.FieldProvider name="projectId">
								<Label>Project</Label>
								<SelectForm>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{projects
											.filter(
												(project) =>
													project.processingJob &&
													project.processingJob.status === "done",
											)
											.map((project) => (
												<SelectItem key={project.id} value={project.id}>
													{project.name}
												</SelectItem>
											))}
									</SelectContent>
								</SelectForm>

								<form.FieldProvider
									name="name"
									validator={(value) => {
										if (!value) return "Please provide a stack name";
										const stackNames = selectedProject.peek().imageStackNames
										if (stackNames && stackNames.includes(value))
											return "A stack with this name already exists";
										return undefined;
									}}
								>
									<div>
										<Label>Stack Name</Label>
										<InputForm placeholder="Type here..." />
										<ErrorText />
									</div>
								</form.FieldProvider>

								<form.FieldProvider
									name="scale"
									validator={z
										.number()
										.int()
										.positive()
										.max(selectedProject.value?.maxWidth)}
									transformToBinding={(v) => v?.toString()}
									transformFromBinding={(v) =>
										!v ? (null as unknown as number) : Number.parseInt(v)
									}
								>
									<div>
										<Label>Video Scale</Label>
										<InputForm
											type="number"
											placeholder="Type here..."
											useTransformed
										/>
										<ErrorText />
									</div>
								</form.FieldProvider>
							</form.FieldProvider>

							<form.FieldProvider
								name="frameRate"
								validator={z
									.number()
									.int()
									.positive()
									.max(selectedProject.value?.maxFrameRate)}
								transformToBinding={(v) => v?.toString()}
								transformFromBinding={(v) =>
									!v ? (null as unknown as number) : Number.parseInt(v)
								}
							>
								<div>
									<Label>
										Output Frames{" "}
										<i className="text-muted-foreground">(per second)</i>
									</Label>
									<InputForm
										type="number"
										placeholder="Type here..."
										useTransformed
									/>
									<ErrorText />
								</div>
							</form.FieldProvider>

							<div className="flex flex-row gap-1">
								<form.FieldProvider
									name="from"
									validator={
										z
											.string()
											.time()
											.or(z.literal(""))
											.refine((value) => {
												const fromSeconds = timeStringToMillis(value) / 1000;
												return fromSeconds <= selectedProject.value?.duration;
											}, "The timestamp must be less than the video duration") as never
									}
								>
									<div className="flex-1">
										<Label>
											From timestamp{" "}
											<i className="text-muted-foreground">
												(format: HH:mm:ss)
											</i>
										</Label>
										<InputForm
											type="time"
											placeholder="Type here..."
											step="1"
											className="block"
										/>
										<ErrorText />
									</div>
								</form.FieldProvider>
								<form.FieldProvider
									name="to"
									validator={
										z
											.tuple([
												z
													.string()
													.time()
													.or(z.literal(""))
													.refine((value) => {
														const toSeconds = timeStringToMillis(value) / 1000;
														return toSeconds <= selectedProject.value?.duration;
													}, "The timestamp must be less than the video duration"),
												z.string(),
											])
											.refine(
												([to, from]) =>
													(!to || to !== from) &&
													validateTimeStringLessThan(to)(from),
												"The 'to' timestamp must be greater than the 'from' timestamp",
											) as never
									}
									validateMixin={["from"]}
								>
									<div className="flex-1">
										<Label>
											To timestamp{" "}
											<i className="text-muted-foreground">
												(format: HH:mm:ss)
											</i>
										</Label>
										<InputForm
											type="time"
											placeholder="Type here..."
											step="1"
											className="block"
										/>
										<ErrorText />
									</div>
								</form.FieldProvider>
							</div>

							<form.FormProvider>
								<ErrorTextForm />
							</form.FormProvider>
						</div>

						<DialogFooter className="mt-4">
							<Button type="submit" disabled={!form.canSubmit.value}>
								Add Stack
							</Button>
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
