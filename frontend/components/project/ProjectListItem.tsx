import {Project} from "@/lib/project.repo";
import Image from "next/image";
import {getImagePath} from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import {ExternalLinkIcon, PencilLineIcon, Trash2Icon} from "lucide-react";
import Link from "next/link";
import {deleteFolder} from "@/lib/file.repo";
import {DeleteFolderContextMenuItem} from "@/components/project/DeleteFolderContextMenuItem";

type ProjectPreviewCardProps = {
  project: Project
}

export async function ProjectListItem({project}: ProjectPreviewCardProps) {
  if (!project.name) return null;

  const stackCount = project.stacks.length
  const resultCount = project.stacks.reduce((acc, stack) => acc + stack.results.length, 0)

  return (<ContextMenu>
    <ContextMenuTrigger>
      <Link
        href={`/${project.name}`}
        className="bg-card text-card-foreground rounded flex flex-col border hover:border-primary border-muted-foreground"
      >
        <Image
          className="object-cover mx-auto w-full rounded-t max-h-48 h-48"
          priority
          width={300}
          height={192}
          src={getImagePath(project.name, "thumbnail.png")}
          alt={project.name}
        />
      <div className="px-4 py-2">
        <h4 className="font-semibold text-lg">{project.name}</h4>
        <p className="text-sm text-muted-foreground">
          {stackCount} stack{stackCount !== 1 && "s"}, {resultCount} result{resultCount !== 1 && "s"}
        </p>
      </div>
    </Link>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <Link href={`/${project.name}`}>
        <ContextMenuItem>
            <ExternalLinkIcon className="h-4 w-4 mr-2"/>
            Open
        </ContextMenuItem>
      </Link>
      <ContextMenuSeparator/>
      <DeleteFolderContextMenuItem paths={[project.name]} />
    </ContextMenuContent>
  </ContextMenu>)
}