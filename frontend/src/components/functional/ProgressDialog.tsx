import {computed, effect, signal, Signal, useComputed, useSignal, useSignalEffect} from "@preact/signals-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "../ui/alert-dialog";
import {Progress} from "../ui/progress";
import {useEffect} from "react";

type Progress = {
  CurrentStep: number
  MaxSteps: number
  Message: string
}

type ProgressDialogProps = {
  label: string
  description: string
  data: Signal<Progress | null>
  onDone?: () => void
}

const now = signal(Date.now())
effect(() => {
  const nowInterval = setInterval(() => {
    now.value = Date.now()
  }, 10)
  return () => clearInterval(nowInterval)
})

export function ProgressDialog({data, label, description, onDone}: ProgressDialogProps) {
  const timeHistory = useSignal<[string, null | number][]>([])
  const time = useSignal<number | null>(null)
  const currentTimer = useComputed(() => time.value && ((now.value - time.value) / 1000).toFixed(2))

  useSignalEffect(() => {
    if (!data.value) {
      timeHistory.value = []
      return
    }
    const currentTimeHistory = timeHistory.peek();
    if (currentTimeHistory.length > 0) {
      for (let i = 0; i < (data.value?.CurrentStep ?? 0); i++) {
        if (!currentTimeHistory[i] || currentTimeHistory[i][1] !== null) {
          continue;
        }

        currentTimeHistory[i][1] = Math.max(0, now.peek() - time.peek()!)
      }
    }

    const isFinished = data.value?.CurrentStep === data.value?.MaxSteps
    const currentValue = isFinished ? timeHistory.peek().reduce((acc, [_, time]) => acc + time!, 0) : null

    timeHistory.value = [...currentTimeHistory, [data.value.Message, currentValue]]
    time.value = isFinished ? null : Date.now()
  })

  return (
    <AlertDialog open={data.value !== null}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{label}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {data.value && <Progress value={data.value.CurrentStep / data.value.MaxSteps * 100}/>}
      <div className="flex flex-col gap-1">
        {timeHistory.value.map(([message, time], i) => (
          <div
            className="flex justify-between"
            key={i}
          >
            <p className="text-sm text-muted-foreground italic">{message}</p>
            <p className="text-sm font-semibold text-muted-foreground">{time !== null ? (time / 1000).toFixed(2) : currentTimer}s</p>
          </div>
        ))}
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => data.value = null}>{!data.value || data.value?.CurrentStep !== data.value?.MaxSteps ? "Send to Background" : "Close"}</AlertDialogCancel>
        <AlertDialogAction
          disabled={!data.value || data.value?.CurrentStep !== data.value?.MaxSteps}
          onClick={() => {
            if (onDone) {
              onDone()
            }
            data.value = null
          }}
        >Done</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  )
}

export function useProgressDialog() {
  return useSignal<Progress | null>(null)
}