"use client";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type Project, deleteProject } from "@/lib/repos/project.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { type PropsWithChildren, useState } from "react";
import { toast } from "sonner";

type DeleteProjectDialogProps = {
	project: Project;
};

export function DeleteProjectDialog({
	project,
	children,
}: PropsWithChildren<DeleteProjectDialogProps>) {
	const [open, setOpen] = useState(false);
	const countStringStacks = `${project.totalStackCount} stack${project.totalStackCount !== 1 ? "s" : ""}`;
	const countStringResults = `${project.totalResultCount} result${project.totalResultCount !== 1 ? "s" : ""}`;
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			{children}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Project</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this project? This action cannot be
						undone. This would remove <strong>{countStringStacks}</strong> and{" "}
						<strong>{countStringResults}</strong>.
					</AlertDialogDescription>
					<AlertDialogDescription>
						In total you would remove{" "}
						<strong>{project.memoryUsage.toFixed(2)} GB</strong> of data.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={async () => {
							setOpen(false);
							toast.promise(
								deleteProject(project.id).then(() =>
									serverRevalidateTag("projects"),
								),
								{
									loading: "Deleting project...",
									success: "Project deleted",
									error: "Failed to delete project",
									duration: 1000,
								},
							);
						}}
					>
						Delete
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
