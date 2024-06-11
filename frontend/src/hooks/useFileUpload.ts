import {useComputed, useSignal} from "@preact/signals-react";
import {useCallback} from "react";

import {uploadVideoFile} from "@/lib/file-upload.repo.ts";

type ProgressState = {
  state: "progress"
  progress: number
}
type SuccessState = {
  state: "success"
  data: {
    filename: string
    originalFilename: string
  }
}
type IdleState = {
  state: "idle"
}
type ErrorState = {
  state: "error"
  error: string
}
export type FileUploadState = ProgressState | SuccessState | IdleState | ErrorState

export const useFileUpload = () => {
  const file = useSignal<File | null>(null)
  const status = useSignal<FileUploadState>({state: "idle"})
  const uploadedFile = useSignal<string | undefined>(undefined)

  const isUploading = useComputed(() => status.value.state === "progress")
  const progressText = useComputed(() => status.value.state === "progress" ? ` ${Math.round(status.value.progress * 100)}%` : "")
  const isFileUploaded = useComputed(() => status.value.state === "success" && status.value.data.originalFilename === file.value?.name)

  const uploadFile = useCallback(async (additionalData?: Array<[string, string]>) => {
    return uploadVideoFile(file.peek(), additionalData, status)
  }, [status, file])

  return {
    file,
    uploadedFile,
    isUploading,
    uploadFile,
    progressText,
    isFileUploaded
  }
}