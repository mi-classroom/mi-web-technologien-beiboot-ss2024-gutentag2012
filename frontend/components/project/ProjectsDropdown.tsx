import {getAllProjects} from "@/lib/project.repo";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ChevronDownIcon} from "@radix-ui/react-icons";
import Link from "next/link";

type ProjectsDropdownProps = {
  selection: string
}

export async function ProjectsDropdown({selection}: ProjectsDropdownProps) {
  const projects = await getAllProjects()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1">
        {selection}
        <ChevronDownIcon/>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {
          projects.map(project => (
            <Link
              key={project.name}
              href={`/${project.name}`}
            >
              <DropdownMenuItem>
                {project.name}
              </DropdownMenuItem>
            </Link>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}