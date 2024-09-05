"use client";

import { ErrorText, ErrorTextForm } from "@/components/functional/ErrorText";
import { FrameBlockers } from "@/components/functional/FrameBlockers";
import { FrameInputs } from "@/components/functional/FrameInputs";
import { LazyImage } from "@/components/functional/LazyImage";
import { useProgressDialog } from "@/components/functional/ProgressDialog";
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
import { listenToJob } from "@/lib/repos/jobs.repo";
// import { listenToProgress } from "@/lib/repos/progress.repo";
import type { Stack } from "@/lib/repos/project.repo";
import { generateImage, getStack } from "@/lib/repos/stack.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { getImagePath } from "@/lib/utils";
import { useFormWithComponents } from "@formsignals/form-react";
import { batch, useSignal, useSignalEffect } from "@preact/signals-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CreateImageFormDrawerProps = {
	allStacks: Stack[];
};

const indexIncludedInFrames = (index: number) => {
	if (!generateImageForm.data.value.frames) return false;
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
	allStacks,
}: CreateImageFormDrawerProps) {
	const { project } = useParams();

	const form = useFormWithComponents(generateImageForm);
	const [carouselApi, setCarouselApi] = useState<CarouselApi>();
	const [selectedStack, setSelectedStack] = useState<Stack>();

	const progress = useProgressDialog({
		label: "Image Generation",
		description:
			"Currently generating image from frames. Be aware that this might take a while depending on the input.",
		messages: [
			"Downloading files from server...",
			"Merging images into long term exposure...",
			"Uploading file to server...",
		],
		pendingMessage: "Connecting to server and generating image...",
	});

	const focussedImage = useSignal(0);
	useSignalEffect(() => {
		const currentFocus = focussedImage.value;
		if (!carouselApi) return;
		carouselApi.scrollTo(currentFocus - 3);
	});

	useEffect(() => {
		if (!carouselApi) return;

		carouselApi.on("select", () => {
			focussedImage.value = carouselApi.selectedScrollSnap() + 3;
		});
	}, [carouselApi, focussedImage]);

	useSignalEffect(() => {
		const stack = form.data.value.stack?.value;
		if (!stack) return;

		getStack(stack).then((foundStack) => {
			form.updateOptions({
				defaultValues: {
					project,
					frames: [1, foundStack.frameCount],
					weights: Array.from({ length: foundStack.frameCount }, () => 1),
				} as never,
				onSubmit: async (values) => {
					progress.isOpen.value = true;
					progress.data.value = {
						status: "queued",
						stepTimestamps: [],
					};

					const resultImage = await generateImage(values);

					return new Promise((r) => {
						listenToJob(resultImage.processingJobId, (data) => {
							progress.data.value = data;

							if (data.status !== "done") return;

							serverRevalidateTag("projects");
							r(undefined);
						}).then(() => {
							isGenerateImageDrawerOpen.value = false;
							form.reset();
						});
					});
				},
			});

			setSelectedStack(foundStack);
		});
	});

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
			<progress.ProgressDialog />
			<DialogSignal
				open={isGenerateImageDrawerOpen}
				onOpenChange={(newOpen) => {
					isGenerateImageDrawerOpen.value = newOpen;
					if (!newOpen) {
						setSelectedStack(undefined);
						generateImageForm.reset();
					}
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
							<form.FieldProvider name="stack">
								<Label>Stack</Label>
								<SelectForm>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{allStacks.map((stack) => (
											<SelectItem key={stack.name} value={`${stack.id}`}>
												{stack.name}{" "}
												<small className="text-xs text-muted-foreground">
													{stack.project}
												</small>
											</SelectItem>
										))}
									</SelectContent>
								</SelectForm>
							</form.FieldProvider>

							<Carousel
								setApi={setCarouselApi}
								opts={{ dragFree: true }}
								className="mx-4 mt-4"
							>
								<CarouselContent>
									{selectedStack?.files.map((name, i) => (
										<CarouselItem
											key={name}
											className="relative basis-1/1 w-1/5"
										>
											<div className="relative">
												<LazyImage
													id={name}
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
															i + 2 < selectedStack.frameCount
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
													className={`object-cover mx-auto rounded border-4${indexIncludedInFrames(i) ? " border-primary" : ""}`}
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

							{selectedStack && (
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
										maxWeight={Math.round(selectedStack.frameCount / 3)}
									/>
									<SliderForm
										min={1}
										max={selectedStack.frameCount}
										step={1}
										onValueChange={onSliderChange}
									>
										{selectedStack.frameCount && (
											<FrameBlockers max={selectedStack.frameCount} min={1} />
										)}
									</SliderForm>

									<Label className="mt-4 mb-2 inline-block">
										Frames to include
									</Label>
									<div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-1">
										{carouselApi && (
											<FrameInputs
												focussedImage={focussedImage}
												max={selectedStack.frameCount}
											/>
										)}
									</div>
									<ErrorText />
								</form.FieldProvider>
							)}

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
