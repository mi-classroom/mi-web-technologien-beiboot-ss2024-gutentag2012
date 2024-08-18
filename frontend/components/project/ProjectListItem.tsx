import { DeleteProjectContextMenuItem } from "@/components/project/DeleteProjectContextMenuItem";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Project } from "@/lib/repos/project.repo";
import { getImagePath } from "@/lib/utils";
import { ExternalLinkIcon, LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ProjectPreviewCardProps = {
	project: Project;
};

export async function ProjectListItem({ project }: ProjectPreviewCardProps) {
	if (!project.name) return null;

	const isProcessing =
		project.processingJob?.status === "processing" ||
		project.processingJob?.status === "queued";
	// TODO Get live data

	const stackCount = project.totalStackCount;
	const resultCount = project.totalResultCount;
	const countString = `${stackCount} stack${stackCount !== 1 ? "s" : ""}, ${resultCount} result${resultCount !== 1 ? "s" : ""}`;

	const totalTime = project.processingJob?.stepTimestamps.reduce(
		(acc, curr, i) => {
			if (i === 0) return acc;
			return acc + curr - project.processingJob.stepTimestamps[i - 1];
		},
		0,
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<Link
					href={`/${project.id}`}
					className="bg-card text-card-foreground rounded flex flex-col border hover:border-primary"
				>
					{!isProcessing ? (
						<Image
							className="object-cover mx-auto w-full rounded-t max-h-48 h-48"
							priority
							width={300}
							height={192}
							src={getImagePath(project.bucketPrefix, "thumbnail.jpg")}
							alt={project.name}
						/>
					) : (
						<div className="w-full h-48 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
							<LoaderCircleIcon className="animate-spin h-8 w-8 mx-auto" />
							<p>{totalTime} ms</p>
						</div>
					)}
					<div className="px-4 py-2">
						<h4 className="font-semibold text-lg">{project.name}</h4>
						<p className="text-sm text-muted-foreground">
							{isProcessing ? "processing..." : countString}
						</p>
					</div>
				</Link>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<Link href={`/${project.id}`}>
					<ContextMenuItem>
						<ExternalLinkIcon className="h-4 w-4 mr-2" />
						Open
					</ContextMenuItem>
				</Link>
				<ContextMenuSeparator />
				<DeleteProjectContextMenuItem projectId={project.id} />
			</ContextMenuContent>
		</ContextMenu>
	);
}
