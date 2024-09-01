"use client";
import {
  AlertDialog, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";
import {PropsWithChildren, useState} from "react";
import {toast} from "sonner"
import {deleteProject, Project, ResultImage, Stack} from "@/lib/repos/project.repo";
import {serverRevalidateTag} from "@/lib/serverRevalidateTag";
import {deleteImage, deleteStack} from "@/lib/repos/stack.repo";

type DeleteImageDialogProps = {
  image: ResultImage;
};

export function DeleteImageDialog({
                                      image,
                                      children
                                    }: PropsWithChildren<DeleteImageDialogProps>) {
	const [open, setOpen] = useState(false)
  return (<AlertDialog open={open} onOpenChange={setOpen}>
		{children}
    <AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Image</AlertDialogTitle>
					<AlertDialogDescription>Are you sure you want to delete this image? This action cannot be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button
            variant="destructive"
            onClick={async () => {
							setOpen(false)
							toast.promise(deleteImage(image.id).then(() => serverRevalidateTag("projects")), {
								loading: "Deleting image...",
								success: "Image deleted",
								error: "Failed to delete image",
								duration: 1000,
							});
            }}
          >
						Delete
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
	</AlertDialog>);
}
