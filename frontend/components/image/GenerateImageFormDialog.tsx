"use client";

import { ErrorText, ErrorTextForm } from "@/components/functional/ErrorText";
import { FrameBlockers } from "@/components/functional/FrameBlockers";
import { FrameInputs } from "@/components/functional/FrameInputs";
import {
	progressDialogData,
	updateProgress,
} from "@/components/functional/ProgressDialog";
import { WeightPicker } from "@/components/functional/WeightPicker";
import {
	generateImageForm,
	isGenerateImageDrawerOpen,
} from "@/components/image/image.signal";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogSignal,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	SelectContent,
	SelectForm,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SliderForm } from "@/components/ui/slider";
import { listenToProgress } from "@/lib/repos/progress.repo";
import { type Project, Stack } from "@/lib/repos/project.repo";
import { createImageFromStack, getFilesInStack } from "@/lib/repos/stack.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { getImagePath } from "@/lib/utils";
import { useFormWithComponents } from "@formsignals/form-react";
import {
	batch,
	useComputed,
	useSignal,
	useSignalEffect,
} from "@preact/signals-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CreateImageFormDrawerProps = {
	projects: Project[];
};

const indexIncludedInFrames = (index: number) => {
	return generateImageForm.data.value.frames.value.some((frame, i) => {
		const isStartFrame = i % 2 === 0;
		if (isStartFrame) {
			const endFrame = generateImageForm.data.value.frames.value[i + 1];
			if (!endFrame) return false;
			return index + 1 >= frame.data.value && index < endFrame.data.value;
		}
		return false;
	});
};

export function GenerateImageFormDialog({
	projects,
}: CreateImageFormDrawerProps) {
	const { project } = useParams();

	const form = useFormWithComponents(generateImageForm);
	const [carouselApi, setCarouselApi] = useState<CarouselApi>();
	const [availableImages, setAvailableImages] = useState<
		Array<{ name: string }>
	>([]);

	const focussedImage = useSignal(0);
	useSignalEffect(() => {
		const currentFocus = focussedImage.value;
		if (!carouselApi) return;
		carouselApi.scrollTo(currentFocus - 2);
	});

	useEffect(() => {
		if (!carouselApi) return;

		carouselApi.on("select", () => {
			focussedImage.value = carouselApi.selectedScrollSnap() + 2;
		});
	}, [carouselApi, focussedImage]);

	const selectedProject = useComputed(() => {
		const selection = form.data.value.project?.value;
		if (!selection) return;
		return projects.find((p) => p.name === selection);
	});

	useSignalEffect(() => {
		const project = form.data.value.project?.value;
		const stack = form.data.value.stack?.value;
		if (!project || !stack) return;

		getFilesInStack(project, stack).then(setAvailableImages);
	});

	useEffect(() => {
		form.updateOptions({
			defaultValues: {
				project,
				frames: [1, availableImages.length],
				weights: Array.from({ length: availableImages.length }, () => 1),
			} as never,
			onSubmit: async (values) => {
				progressDialogData.value = {
					CurrentStep: 0,
					MaxSteps: 0,
					Message: "Waiting for server...",
					options: {
						label: "Image Generating",
						description:
							"Currently processing the given frames to generate a long term exposure image. Be aware that this might take a while depending on the input.",
					},
				};

				return new Promise((r) => {
					const identifier = `${values.project}-${values.stack}-${values.frames.join("-")}`;
					listenToProgress("generate-image", identifier, (data) => {
						updateProgress(data);
						if (data.CurrentStep !== data.MaxSteps) return;
						serverRevalidateTag("projects");
						r(undefined);
					}).then(async () => {
						isGenerateImageDrawerOpen.value = false;
						await createImageFromStack(values);
						await form.reset();
					});
				});
			},
			validator: (values) => {
				if (!values.project || !values.stack) return undefined;
				const selectedProject = projects.find((p) => p.name === values.project);
				if (!selectedProject) return undefined;

				const selectedStack = selectedProject.stacks.find(
					(s) => s.name === values.stack,
				);
				if (!selectedStack) return undefined;

				if (
					selectedStack.results.some((result) =>
						result.frames.every((f, i) => f === values.frames[i]),
					)
				)
					return "This image is already generated";

				return undefined;
			},
		});
	}, [availableImages, form, projects, project]);

	const onSliderChange = useCallback(
		(values: number[]) => {
			const changedPictureIndex = values.find(
				(v, i) => v !== form.json.peek().frames[i],
			);
			form.handleChange("frames" as never, values as never);
			if (changedPictureIndex !== undefined)
				focussedImage.value = changedPictureIndex;
		},
		[form, focussedImage],
	);

	return (
		<>
			<DialogSignal
				open={isGenerateImageDrawerOpen}
				onOpenChange={(newOpen) => {
					isGenerateImageDrawerOpen.value = newOpen;
					if (!newOpen) generateImageForm.reset();
				}}
			>
				<DialogContent className="max-w-[80vw]">
					<DialogHeader>
						<DialogTitle>Generate new Image</DialogTitle>
						<DialogDescription>
							Here you can generate a new image from a stack.
						</DialogDescription>
					</DialogHeader>

					<form.FormProvider>
						<form
							style={{
								width: "calc(80vw - 48px)",
								maxWidth: "calc(80vw - 48px)",
							}}
							onSubmit={(e) => {
								e.preventDefault();
								void generateImageForm.handleSubmit();
							}}
						>
							<form.FieldProvider name="project">
								<Label>Project</Label>
								<SelectForm>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{projects.map((project) => (
											<SelectItem key={project.name} value={project.name}>
												{project.name}
											</SelectItem>
										))}
									</SelectContent>
								</SelectForm>
							</form.FieldProvider>
							{selectedProject.value && (
								<form.FieldProvider name="stack">
									<Label>Stack</Label>
									<SelectForm>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{selectedProject.value.stacks.map((stack) => (
												<SelectItem key={stack.name} value={stack.name}>
													{stack.name}
												</SelectItem>
											))}
										</SelectContent>
									</SelectForm>
								</form.FieldProvider>
							)}

							<Carousel
								setApi={setCarouselApi}
								opts={{ dragFree: true }}
								className="mx-4 mt-4"
							>
								<CarouselContent>
									{availableImages.map(({ name }, i) => (
										<CarouselItem key={name} className="basis-1/1 relative">
											<div className="relative">
												{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
												<img
													onClick={() => {
														const frames = form.json.peek().frames;

														const isIncludedButNotEdge = frames.findIndex(
															(frame, index, arr) => {
																const isStartOfPair = index % 2 === 0;
																const start = isStartOfPair
																	? frame
																	: arr[index - 1];
																const end = isStartOfPair
																	? arr[index + 1]
																	: frame;
																if (start === undefined || end === undefined)
																	return false;
																return start - 1 < i && i + 1 < end;
															},
														);
														let isNotIncludedButNotEdge = frames.findIndex(
															(frame, index, arr) => {
																const isStartOfPair = index % 2 === 0;

																// We only want to check from the start of a pair or for the last element
																if (isStartOfPair) {
																	const prevEnd = arr[index - 1];
																	// In this case it before the first boundary
																	if (prevEnd === undefined)
																		return i + 2 < frame;
																	return prevEnd < i && i + 2 < frame;
																}
																return false;
															},
														);
														if (
															isNotIncludedButNotEdge === -1 &&
															frames[frames.length - 1] < i &&
															i + 2 < availableImages.length
														) {
															isNotIncludedButNotEdge = frames.length;
														}

														const isIncludedEdge = frames.findIndex((frame) => {
															return i + 1 === frame;
														});
														const isNotIncludedEdge = frames.findIndex(
															(frame, index) => {
																const isStartOfPair = index % 2 === 0;
																return isStartOfPair
																	? i + 2 === frame
																	: i === frame;
															},
														);

														// Case 1: The frame is included in the selection, but not at the edge, then we split the pair
														if (isIncludedButNotEdge !== -1) {
															batch(() => {
																form.pushValueToArrayAtIndex(
																	"frames" as never,
																	(isIncludedButNotEdge + 1) as never,
																	i as never,
																);
																form.pushValueToArrayAtIndex(
																	"frames" as never,
																	(isIncludedButNotEdge + 2) as never,
																	(i + 2) as never,
																);
															});
															return;
														}

														// Case 2: The frame is not included in the selection, but not at the edge of one, then we create a new the pair
														if (isNotIncludedButNotEdge !== -1) {
															batch(() => {
																form.pushValueToArrayAtIndex(
																	"frames" as never,
																	isNotIncludedButNotEdge as never,
																	(i + 1) as never,
																);
																form.pushValueToArrayAtIndex(
																	"frames" as never,
																	(isNotIncludedButNotEdge + 1) as never,
																	(i + 1) as never,
																);
															});
															return;
														}

														// Case 3: The frame is included in the selection, but at the edge, then we shrink the pair
														if (isIncludedEdge !== -1) {
															const isStartOfPair = isIncludedEdge % 2 === 0;
															const arrayEntry = form.data.peek().frames.peek()[
																isIncludedEdge
															].data;
															const pairEntry = form.data.peek().frames.peek()[
																isIncludedEdge + (isStartOfPair ? 1 : -1)
															].data;

															// If the selection is only one frame, we remove the pair
															if (arrayEntry.peek() !== pairEntry.peek()) {
																arrayEntry.value += isStartOfPair ? 1 : -1;
																return;
															}

															batch(() => {
																form.removeValueFromArray(
																	"frames" as never,
																	isIncludedEdge as never,
																);
																form.removeValueFromArray(
																	"frames" as never,
																	isIncludedEdge as never,
																);
															});
															return;
														}

														// Case 4: The frame is not included in the selection, but at the edge, then we grow the pair
														if (isNotIncludedEdge !== -1) {
															const isStartOfPair = isNotIncludedEdge % 2 === 0;
															const arrayEntry = form.data.peek().frames.peek()[
																isNotIncludedEdge
															].data;
															const pairEntry = form.data.peek().frames.peek()[
																isNotIncludedEdge + (isStartOfPair ? -2 : 1)
															]?.data;

															// If the selection is only one frame, we remove the pair
															if (pairEntry?.peek() - arrayEntry.peek() !== 2) {
																arrayEntry.value += isStartOfPair ? -1 : 1;
																return;
															}

															batch(() => {
																form.removeValueFromArray(
																	"frames" as never,
																	isNotIncludedEdge,
																);
																form.removeValueFromArray(
																	"frames" as never,
																	isNotIncludedEdge,
																);
															});
														}
													}}
													className={`object-cover mx-auto rounded max-w-96 w-96 border-4${indexIncludedInFrames(i) ? " border-primary" : ""}`}
													loading="lazy"
													src={getImagePath(encodeURIComponent(name))}
													alt={name}
												/>
												<p className="absolute top-0.5 left-0.5 bg-card text-card-foreground rounded-br p-1 text-xs">
													{i + 1}
												</p>
												<p className="absolute top-0.5 right-0.5 bg-card text-card-foreground rounded-bl p-1 text-xs">
													{form.data.value.weights.value[i]?.data} x
												</p>
											</div>
										</CarouselItem>
									))}
								</CarouselContent>
							</Carousel>

							<form.FieldProvider
								name="frames"
								validator={(values) => {
									if (values.length % 2 !== 0) {
										return "Frames must be in pairs";
									}
									return (
										values.some((v, i, arr) => i !== 0 && v < arr[i - 1]) &&
										"Frames must be in ascending order"
									);
								}}
								validateOnNestedChange
							>
								<WeightPicker
									focussedImage={focussedImage}
									maxWeight={Math.round(availableImages.length / 3)}
								/>
								<SliderForm
									min={1}
									max={availableImages.length}
									step={1}
									onValueChange={onSliderChange}
								>
									{availableImages.length && (
										<FrameBlockers max={availableImages.length} min={1} />
									)}
								</SliderForm>

								<Label className="mt-4 mb-2 inline-block">
									Frames to include
								</Label>
								<div className="flex flex-col gap-2">
									{carouselApi && (
										<FrameInputs
											focussedImage={focussedImage}
											max={availableImages.length}
										/>
									)}
								</div>
								<ErrorText />
							</form.FieldProvider>

							<ErrorTextForm />

							<DialogFooter className="mt-4">
								<Button type="submit" disabled={!form.canSubmit.value}>
									Generate Image
								</Button>
								<DialogClose asChild>
									<Button type="button" variant="outline">
										Cancel
									</Button>
								</DialogClose>
							</DialogFooter>
						</form>
					</form.FormProvider>
				</DialogContent>
			</DialogSignal>
		</>
	);
}
