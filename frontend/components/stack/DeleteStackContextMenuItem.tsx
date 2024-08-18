"use client";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { deleteStack } from "@/lib/repos/stack.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { Trash2Icon } from "lucide-react";

type DeleteFolderContextMenuItemProps = {
	stackId: number;
};

export function DeleteStackContextMenuItem({
	stackId,
}: DeleteFolderContextMenuItemProps) {
	return (
		<ContextMenuItem
			className="group bg-destructive text-destructive-foreground focus:bg-destructive/40"
			onClick={async () => {
				deleteStack(stackId);
				await serverRevalidateTag("stacks");
			}}
		>
			<Trash2Icon className="h-4 w-4 mr-2" />
			Delete
		</ContextMenuItem>
	);
}
