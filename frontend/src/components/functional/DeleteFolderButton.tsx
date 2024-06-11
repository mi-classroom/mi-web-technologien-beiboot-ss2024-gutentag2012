import {Button} from "@/components/ui/button.tsx";
import {deleteFolder} from "@/lib/file-upload.repo.ts";

type DeleteProjectButtonProps = {
  project: string
}

export function DeleteFolderButton({project}: DeleteProjectButtonProps) {
  return (
    <Button
      onClick={() => deleteFolder(project).then(() => window.location.reload())}
      size="sm"
      variant="destructive"
    >
      Delete
    </Button>
  )
}