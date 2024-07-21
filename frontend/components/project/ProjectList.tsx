import { CreateProjectListItem } from "@/components/project/CreateProjectListItem";
import { ProjectListItem } from "@/components/project/ProjectListItem";
import type { Project } from "@/lib/repos/project.repo";

export async function ProjectList({ projects }: { projects: Project[] }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
			{projects.map((project) => (
				<ProjectListItem key={project.name} project={project} />
			))}

			<CreateProjectListItem />
		</div>
	);
}
