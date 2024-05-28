import {Button} from "@/components/ui/button.tsx";
import {InputForm} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useForm} from "@formsignals/form-react";
import {ErrorText, ErrorTextForm} from "@/components/ui/ErrorText.tsx";
import {ZodAdapter} from "@formsignals/validation-adapter-zod";
import {z} from "zod";
import {useEffect, useMemo} from "react";
import {useSignal} from "@preact/signals-react";
import {createProjectStack, listenToProgress} from "@/lib/video-processor.repo.ts";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTrigger } from "../ui/alert-dialog";
import { Progress } from "../ui/progress";
import { ProgressDialog, useProgressDialog } from "./ProgressDialog";

type SrcVideoProps = {
  duration: string
}

const validateTimeStringLessThan = (duration?: string | null) => (value?: string | null) => {
  if (!duration || !value) return true

  const [hoursCompare, minutesCompare, secondsCompare] = duration.split(":").map(v => parseInt(v))
  const [hours, minutes, seconds] = value.split(":").map(v => parseInt(v))

  if (hours > hoursCompare) return false
  if (hours === hoursCompare && minutes > minutesCompare) return false
  return !(hours === hoursCompare && minutes === minutesCompare && seconds > secondsCompare)
}

export function ImageStackForm({project, stacks}: {project:string, stacks: string[]}) {
  const usedVariables = useMemo(() => stacks.map(stack => {
    const [_, scale, frameRate, from, to] = stack.split("--")
    return {
      scale: parseInt(scale.replace("scale=", "")),
      from: from.replace("from=", "").replaceAll("-", ":"),
      to: to.replace("to=", "").replaceAll("-", ":"),
      frameRate: parseInt(frameRate.replace("frameRate=", ""))
    }
  }), [stacks])

  const progressDialogData = useProgressDialog()

  const srcVideo = useSignal<SrcVideoProps | null>(null)
  const form = useForm({
    validatorAdapter: ZodAdapter,
    defaultValues: {
      scale: 1600,
      from: "",
      to: "",
      frameRate: 30
    },
    onSubmit: async values => {
      await createProjectStack(project, values).then(success => console.log(success)).catch(err => console.error(err));
      return new Promise(r => {
        const identifier = `${project.replaceAll("/", encodeURIComponent("/"))}-${values.frameRate}-${values.scale}-${values.from}-${values.to}`
        listenToProgress("create-stack", identifier, data => {
          progressDialogData.value = data
          if(data.CurrentStep !== data.MaxSteps) return

          const projectName = project.split("/")[0]
          window.location.assign(`/project/${projectName}/stack/output--scale=${values.scale}--frameRate=${values.frameRate}--from=${values.from.replaceAll(":", "-")}--to=${values.to.replaceAll(":", "-")}`)
          progressDialogData.value = null
          r(undefined)
        })
      })
    },
    validator: values => {
      const stackAlreadyUsed = usedVariables.some(({scale, from, to, frameRate}) => values.scale === scale && values.from === from && values.to === to && values.frameRate === frameRate)
      return stackAlreadyUsed && "This image stack already exists"
    }
  })

  useEffect(() => {
    const video = document.querySelector("#project-video") as HTMLVideoElement
    if (!video) return

    const setDuration = () => {
      const duration = video.duration
      const hours = ("0" + Math.floor(duration / 3600)).slice(-2)
      const minutes = ("0" + Math.floor(duration / 60)).slice(-2)
      const seconds = ("0" + Math.floor(duration % 60)).slice(-2)
      srcVideo.value = {
        duration: `${hours}:${minutes}:${seconds}`
      }
    }

    if(isNaN(video.duration)) {
      video.onloadedmetadata = setDuration
    } else {
      setDuration()
    }
  }, []);

  return (
    <div className="flex-col flex gap-2">
      <ProgressDialog label="Video Processing" description="Currently processing project video and extracting frames. Be aware that this might take a while depending on the input." data={progressDialogData} />
    
      <form.FormProvider>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.FieldProvider
          name="scale"
          validator={z.number().int().min(1)}
          transformToBinding={v => v.toString()}
          transformFromBinding={v => !v ? null as unknown as number : parseInt(v)}
        >
          <div>
            <Label>Video Scale</Label>
            <InputForm
              type="number"
              placeholder="Type here..."
              useTransformed
            />
            <ErrorText/>
          </div>
        </form.FieldProvider>
        <form.FieldProvider
          name="frameRate"
          validator={z.number().int().min(1)}
          transformToBinding={v => v.toString()}
          transformFromBinding={v => !v ? null as unknown as number : parseInt(v)}
        >
          <div>
            <Label>Output Frames <i className="text-muted-foreground">(per second)</i></Label>
            <InputForm
              type="number"
              placeholder="Type here..."
              useTransformed
            />
            <ErrorText/>
          </div>
        </form.FieldProvider>
        <form.FieldProvider
          name="from"
          validator={z.string().time().or(z.literal("")).refine(validateTimeStringLessThan(srcVideo.value?.duration), "The timestamp must be less than the video duration")}
        >
          <div>
            <Label>From timestamp <i className="text-muted-foreground">(format: HH:mm:ss)</i></Label>
            <InputForm
              type="time"
              placeholder="Type here..."
              step="1"
            />
            <ErrorText/>
          </div>
        </form.FieldProvider>
        <form.FieldProvider
          name="to"
          validator={
            z.tuple([
              z.string().time().or(z.literal("")).refine(validateTimeStringLessThan(srcVideo.value?.duration), "The timestamp must be less than the video duration"),
              z.string()
            ]).refine(([to, from]) => (!to || to !== from) && validateTimeStringLessThan(to)(from), "The 'to' timestamp must be greater than the 'from' timestamp")
          }
          validateMixin={["from"]}
        >
          <div>
            <Label>To timestamp <i className="text-muted-foreground">(format: HH:mm:ss)</i></Label>
            <InputForm
              type="time"
              placeholder="Type here..."
              step="1"
            />
            <ErrorText/>
          </div>
        </form.FieldProvider>

        <Button
          type="submit"
          className="mt-2"
          disabled={!form.canSubmit.value}
        >
          Create Image Stack
        </Button>

        <ErrorTextForm />
      </form>
        </form.FormProvider>
    </div>
  )
}