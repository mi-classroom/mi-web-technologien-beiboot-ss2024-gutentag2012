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
import type { Stack } from "@/lib/repos/project.repo";
import { deleteStack } from "@/lib/repos/stack.repo";
import { serverRevalidateTag } from "@/lib/serverRevalidateTag";
import { type PropsWithChildren, useState } from "react";
import { toast } from "sonner";

type DeleteStackDialogProps = {
	stack: Stack;
};

export function DeleteStackDialog({
	stack,
	children,
}: PropsWithChildren<DeleteStackDialogProps>) {
	const [open, setOpen] = useState(false);
	const countStringResults = `${stack.totalResultCount} result${stack.totalResultCount !== 1 ? "s" : ""}`;
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			{children}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Stack</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this stack? This action cannot be
						undone. This would remove <strong>{countStringResults}</strong>.
					</AlertDialogDescription>
					<AlertDialogDescription>
						In total you would remove{" "}
						<strong>{stack.memoryUsage.toFixed(2)} GB</strong> of data.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={async () => {
							setOpen(false);
							toast.promise(
								deleteStack(stack.id).then(() => serverRevalidateTag("stacks")),
								{
									loading: "Deleting stack...",
									success: "Stack deleted",
									error: "Failed to delete stack",
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
