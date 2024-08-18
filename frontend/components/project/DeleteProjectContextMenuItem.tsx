"use client";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { deleteProject } from "@/lib/repos/project.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { Trash2Icon } from "lucide-react";

type DeleteFolderContextMenuItemProps = {
	projectId: number;
};

export function DeleteProjectContextMenuItem({
	projectId,
}: DeleteFolderContextMenuItemProps) {
	return (
		<ContextMenuItem
			className="group bg-destructive text-destructive-foreground focus:bg-destructive/40"
			onClick={async () => {
				deleteProject(projectId);
				await serverRevalidateTag("projects");
			}}
		>
			<Trash2Icon className="h-4 w-4 mr-2" />
			Delete
		</ContextMenuItem>
	);
}
