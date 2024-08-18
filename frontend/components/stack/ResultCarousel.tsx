"use client";

import {
	generateImageForm,
	isGenerateImageDrawerOpen,
} from "@/components/image/image.signal";
import { DeleteImageContextMenuItem } from "@/components/stack/DeleteImageContextMenuItem";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ProjectFull, ResultImage, Stack } from "@/lib/repos/project.repo";
import { getImagePath } from "@/lib/utils";
import { batch } from "@preact/signals-react";
import { ExternalLinkIcon, ImagePlusIcon, PencilLineIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ResultCarouselProps = {
	results: [ProjectFull, Stack, ResultImage][];
	className?: string;
};

export function ResultCarousel({ results, className }: ResultCarouselProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Results</CardTitle>
				<CardDescription>Manage your results</CardDescription>
			</CardHeader>
			<CardContent>
				{results.length === 0 ? (
					<p className="text-muted-foreground text-center mt-4">
						No results found
					</p>
				) : (
					<Carousel className="mb-2 mx-10">
						<CarouselContent>
							{results.map(([project, stack, result]) => (
								<CarouselItem
									key={
										project.bucketPrefix + stack.bucketPrefix + result.filename
									}
									className="basis-1/1 relative"
								>
									<ContextMenu>
										<ContextMenuTrigger>
											<Link
												className="relative"
												href={getImagePath(
													project.bucketPrefix,
													stack.bucketPrefix,
													"outputs",
													result.filename,
												)}
												target="_blank"
											>
												<Image
													className="object-cover mx-auto w-full rounded-t max-h-96 h-96"
													priority
													width={660}
													height={400}
													src={getImagePath(
														project.bucketPrefix,
														stack.bucketPrefix,
														"outputs",
														result.filename,
													)}
													alt={result}
												/>
											</Link>
										</ContextMenuTrigger>
										<ContextMenuContent>
											<Link
												href={getImagePath(
													project.bucketPrefix,
													stack.bucketPrefix,
													"outputs",
													result.filename,
												)}
												target="_blank"
											>
												<ContextMenuItem>
													<ExternalLinkIcon className="h-4 w-4 mr-2" />
													Open
												</ContextMenuItem>
											</Link>
											<ContextMenuItem
												onClick={() => {
													batch(() => {
														generateImageForm.handleChange(
															"stack" as never,
															`${stack.id}` as never,
														);
														generateImageForm.handleChange(
															"frames" as never,
															result.frames as never,
														);
														generateImageForm.handleChange(
															"weights" as never,
															result.weights as never,
														);
													});
													isGenerateImageDrawerOpen.value = true;
												}}
											>
												<PencilLineIcon className="h-4 w-4 mr-2" />
												Create variant
											</ContextMenuItem>
											<ContextMenuSeparator />
											<DeleteImageContextMenuItem imageId={result.id} />
										</ContextMenuContent>
									</ContextMenu>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				)}
			</CardContent>
			<CardFooter>
				<Button
					onClick={() => {
						isGenerateImageDrawerOpen.value = true;
					}}
				>
					<ImagePlusIcon className="h-4 w-4 mr-2" />
					Generate Image
				</Button>
			</CardFooter>
		</Card>
	);
}
