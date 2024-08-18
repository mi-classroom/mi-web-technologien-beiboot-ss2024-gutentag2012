import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllProjects } from "@/lib/repos/project.repo";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Link from "next/link";

type ProjectsDropdownProps = {
	selection: string;
};

export async function ProjectsDropdown({ selection }: ProjectsDropdownProps) {
	const projects = await getAllProjects();
	const selectedProject = projects.find((project) => project.id === +selection);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-1">
				{selectedProject?.name}
				<ChevronDownIcon />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{projects.map((project) => (
					<Link key={project.id} href={`/${project.id}`}>
						<DropdownMenuItem>{project.name}</DropdownMenuItem>
					</Link>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
