"use client";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { deleteFolder } from "@/lib/repos/file.repo";
import { Project } from "@/lib/repos/project.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { getImagePath } from "@/lib/utils";
import { ExternalLinkIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type DeleteFolderContextMenuItemProps = {
	paths: string[];
};

export function DeleteFolderContextMenuItem({
	paths,
}: DeleteFolderContextMenuItemProps) {
	return (
		<ContextMenuItem
			className="group bg-destructive text-destructive-foreground focus:bg-destructive/40"
			onClick={async () => {
				await deleteFolder(...paths);
				await serverRevalidateTag("projects");
			}}
		>
			<Trash2Icon className="h-4 w-4 mr-2" />
			Delete
		</ContextMenuItem>
	);
}
