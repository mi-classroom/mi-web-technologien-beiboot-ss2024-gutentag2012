import {useSignal} from "@preact/signals-react";
import {useCallback} from "react";
import {createProjectStack as createLongTermExposureRequest} from "@/lib/video-processor.repo.ts";

type IdleState = {
  state: "idle"
}
type ProgressState = {
  state: "progress"
}
type SuccessState = {
  state: "success"
  data?: {
    filename: string
  }
}
type ErrorState = {
  state: "error"
  error: string
}
export type LongTermExposureState = IdleState | ProgressState | SuccessState | ErrorState

export const useCreateLongTermExposure = () => {
  const status = useSignal<LongTermExposureState>({state: "idle"})

  const createLongTermExposure = useCallback(async (filename: string, values: {
    scale: number,
    from: string,
    to: string,
    frameRate: number
  }) => {
    console.log("Creating long term exposure", filename, values)
    status.value = {state: "progress"}
    createLongTermExposureRequest(filename, values).then(() => {
      status.value = {state: "success"}
    }).catch((error) => {
      status.value = {state: "error", error}
    })
  }, [status])

  return {
    status,
    createLongTermExposure
  }
}