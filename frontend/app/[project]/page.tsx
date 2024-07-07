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
import { getApiBaseUrl } from "@/lib/env";
import { getAllProjects } from "@/lib/repos/project.repo";
import { getProjectFile } from "@/lib/utils";
import Link from "next/link";

export default async function Project({
	params,
}: { params: { project: string } }) {
	const projects = await getAllProjects();
	const currentProject = projects.find(
		(project) => project.name === params.project,
	);

	if (!currentProject) {
		return <h1>Project not found</h1>;
	}

	const videoFile = getProjectFile(currentProject);
	const allResults = currentProject.stacks.flatMap((stack) => stack.results);

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
				{videoFile && (
					// biome-ignore lint/a11y/useMediaCaption: <explanation>
					<video
						id="project-video"
						className="h-[500px]"
						src={`${getApiBaseUrl()}/file-upload/get/${encodeURIComponent(videoFile)}`}
						controls
						preload="auto"
					/>
				)}
			</div>

			<ResultCarousel results={allResults} className="mt-4" />

			<StackTable stacks={currentProject.stacks} className="mt-4" />
		</main>
	);
}
