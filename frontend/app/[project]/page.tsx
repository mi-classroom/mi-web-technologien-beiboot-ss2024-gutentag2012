import { ProjectsDropdown } from "@/components/project/ProjectsDropdown";
import { ResultCarousel } from "@/components/stack/ResultCarousel";
import { StackTable } from "@/components/stack/StackTable";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	type ProjectFull,
	type ResultImage,
	type Stack,
	getProjectById,
} from "@/lib/repos/project.repo";
import { getStacksForProject } from "@/lib/repos/stack.repo";
import { getImagePath } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Project({
	params,
}: { params: { project: string } }) {
	const currentProject = await getProjectById(params.project);
	const stacks = await getStacksForProject(params.project);

	if (!currentProject) {
		return <h1>Project not found</h1>;
	}
	if (
		currentProject.processingJob &&
		currentProject.processingJob.status !== "done"
	) {
		return <h1>This project is still being processed</h1>;
	}

	const resultImages = currentProject.imageStacks
		.flatMap((stack) =>
			stack.resultImages.map((result) => [currentProject, stack, result]),
		)
		.sort((a, b) => b[2].id - a[2].id) as unknown as [
		ProjectFull,
		Stack,
		ResultImage,
	][];

	return (
		<main className="container overflow-y-auto py-2">
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Projects</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>

					<BreadcrumbSeparator />

					<BreadcrumbPage>
						<ProjectsDropdown selection={params.project} />
					</BreadcrumbPage>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="w-full flex justify-center">
				{currentProject.videoFile && (
					// biome-ignore lint/a11y/useMediaCaption: <explanation>
					<video
						id="project-video"
						className="h-[500px]"
						src={getImagePath(
							currentProject.bucketPrefix,
							currentProject.videoFile,
						)}
						controls
						preload="auto"
					/>
				)}
			</div>

			<ResultCarousel results={resultImages} className="mt-4" />

			<StackTable stacks={stacks} className="mt-4" />
		</main>
	);
}
