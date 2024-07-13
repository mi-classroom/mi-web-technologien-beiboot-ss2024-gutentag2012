"use client";

import {
	generateImageForm,
	isGenerateImageDrawerOpen,
} from "@/components/image/image.signal";
import { DeleteFolderContextMenuItem } from "@/components/project/DeleteFolderContextMenuItem";
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
import type { ResultImage } from "@/lib/repos/project.repo";
import { getImagePath } from "@/lib/utils";
import { batch } from "@preact/signals-react";
import { ExternalLinkIcon, ImagePlusIcon, PencilLineIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ResultCarouselProps = {
	results: ResultImage[];
	className?: string;
};

export function ResultCarousel({ results, className }: ResultCarouselProps) {
	const sortedResults = results.toSorted(
		(a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0),
	);
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Results</CardTitle>
				<CardDescription>Manage your results</CardDescription>
			</CardHeader>
			<CardContent>
				{sortedResults.length === 0 ? (
					<p className="text-muted-foreground text-center mt-4">
						No results found
					</p>
				) : (
					<Carousel className="mb-2 mx-10">
						<CarouselContent>
							{sortedResults.map((result) => (
								<CarouselItem
									key={result.project + result.stack + result.name}
									className="basis-1/1 relative"
								>
									<ContextMenu>
										<ContextMenuTrigger>
											<Link
												className="relative"
												href={getImagePath(
													result.project,
													result.stack,
													"outputs",
													result.name,
												)}
												target="_blank"
											>
												<Image
													className="object-cover mx-auto w-full rounded-t max-h-96 h-96"
													priority
													width={660}
													height={400}
													src={getImagePath(
														result.project,
														result.stack,
														"outputs",
														result.name,
													)}
													alt={result.name}
												/>
												<p className="absolute top-0 left-0 rounded-br bg-background text-accent-foreground p-2 text-xs">
													Frames:{" "}
													{result.frames
														.reduce((acc, frame, i, arr) => {
															const isStartFrame = i % 2 === 0;
															if (!isStartFrame) return acc;
															acc.push(`${frame} - ${arr[i + 1]}`);
															return acc;
														}, [] as string[])
														.join(", ")}
												</p>
											</Link>
										</ContextMenuTrigger>
										<ContextMenuContent>
											<Link
												href={getImagePath(
													result.project,
													result.stack,
													"outputs",
													result.name,
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
															"project" as never,
															result.project as never,
														);
														generateImageForm.handleChange(
															"stack" as never,
															result.stack as never,
														);
														generateImageForm.handleChange(
															"frames" as never,
															result.frames as never,
														);
													});
													isGenerateImageDrawerOpen.value = true;
												}}
											>
												<PencilLineIcon className="h-4 w-4 mr-2" />
												Create variant
											</ContextMenuItem>
											<ContextMenuSeparator />
											<DeleteFolderContextMenuItem
												paths={[
													result.project,
													result.stack,
													"outputs",
													result.name,
												]}
											/>
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
