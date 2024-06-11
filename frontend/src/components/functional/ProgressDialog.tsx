import { Signal, useSignal } from "@preact/signals-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Progress } from "../ui/progress";

type Progress = {
  CurrentStep: number
  MaxSteps: number
  Message: string
}

type ProgressDialogProps = {
    label: string
    description: string
    data: Signal<Progress | null>
}

export function ProgressDialog({data, label, description}: ProgressDialogProps) {
    return (
    <AlertDialog open={data.value !== null}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{label}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {data.value && <Progress value={data.value.CurrentStep / data.value.MaxSteps * 100} />}
      <p className="text-sm text-muted-foreground italic">{data.value?.Message}</p>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => data.value = null}>Close</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
    )
}

export function useProgressDialog() {
    return useSignal<Progress | null>(null)
}