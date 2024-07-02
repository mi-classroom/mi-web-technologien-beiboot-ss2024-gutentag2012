"use client"
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
import {serverRevalidateTag} from "@/lib/serverRevalidateTag";

type DeleteFolderContextMenuItemProps = {
  paths: string[]
}

export function DeleteFolderContextMenuItem({paths}: DeleteFolderContextMenuItemProps) {
  return (
    <ContextMenuItem
      className="group bg-destructive text-destructive-foreground focus:bg-destructive/40"
      onClick={async () => {
        await deleteFolder(...paths)
        await serverRevalidateTag("projects")
      }}
    >
        <Trash2Icon className="h-4 w-4 mr-2"/>
        Delete
      </ContextMenuItem>
  )
}