import { ProjectList } from "@/components/project/ProjectList";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { getAllProjects } from "@/lib/repos/project.repo";

export const dynamic = "force-dynamic";

export default async function Project() {
	const projects = await getAllProjects();
	return (
		<main className="container py-2">
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbPage>Projects</BreadcrumbPage>
				</BreadcrumbList>
			</Breadcrumb>

			<ProjectList projects={projects} />
		</main>
	);
}
