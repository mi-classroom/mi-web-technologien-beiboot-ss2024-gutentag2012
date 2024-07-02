"use client"
import {Project, Stack} from "@/lib/project.repo";
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
import {DropdownMenuItem} from "@/components/ui/dropdown-menu";

type StackDeleteMenuItemProps = {
  stack: Stack
}

export function StackDeleteMenuItem({stack}: StackDeleteMenuItemProps) {
  return (
    <DropdownMenuItem
      className="group bg-destructive text-destructive-foreground focus:bg-destructive/40"
      onClick={async () => {
        await deleteFolder(stack.project, stack.name)
        await serverRevalidateTag("projects")
      }}
    >
        <Trash2Icon className="h-4 w-4 mr-2"/>
        Delete
      </DropdownMenuItem>
  )
}