"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader, DrawerTitle
} from "@/components/ui/drawer";
import {createStackForm, isCreateStackDrawerOpen} from "@/components/stack/stack.signal";
import {Button} from "@/components/ui/button";
import {serverRevalidateTag} from "@/lib/serverRevalidateTag";
import {useFormWithComponents} from "@formsignals/form-react";
import {useEffect} from "react";
import {useVideoDuration} from "@/lib/hooks/useVideoDuration";
import {z} from "zod";
import {ZodAdapter} from "@formsignals/validation-adapter-zod";
import {Label} from "@/components/ui/label";
import {InputForm} from "@/components/ui/input";
import {ErrorText, ErrorTextForm} from "@/components/functional/ErrorText";
import {getProjectFile, validateTimeStringLessThan} from "@/lib/utils";
import {ProjectsDropdown} from "@/components/project/ProjectsDropdown";
import {createStack} from "@/lib/stack.repo";
import {Project} from "@/lib/project.repo";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ChevronDownIcon} from "@radix-ui/react-icons";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {Select, SelectContent, SelectForm, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {listenToProgress} from "@/lib/progress.repo";
import {progressDialogData, updateProgress} from "@/components/functional/ProgressDialog";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSignal,
  DialogTitle
} from "@/components/ui/dialog";
import {createProjectForm, isCreateProjectDrawerOpen} from "@/components/project/project.signals";

type CreateStackFormDrawerProps = {
  projects: Project[]
}

export function CreateStackFormDialog({projects}: CreateStackFormDrawerProps) {
  const form = useFormWithComponents(createStackForm)
  const {project} = useParams()
  const selectedProject = projects.find(p => p.name === project)

  const srcVideo = useVideoDuration("project-video")

  useEffect(() => {
    form.updateOptions({
      validatorAdapter: ZodAdapter,
      defaultValues: {
        scale: 1600,
        from: "",
        to: "",
        frameRate: 30,
      },
      validator: values => {
        const currentSelectedProject = projects.find(p => getProjectFile(p) === values.filename)
        const stackAlreadyUsed = currentSelectedProject?.stacks?.some(({
                                                                           scale,
                                                                           from,
                                                                           to,
                                                                           frameRate
                                                                         }) => values.scale === scale && values.from === from && values.to === to && values.frameRate === frameRate)
        return stackAlreadyUsed && "This image stack already exists"
      },
      onSubmit: async values => {
        progressDialogData.value = {
          CurrentStep: 0,
          MaxSteps: 0,
          Message: "Waiting for server...",
          options: {
            label: "Video Processing",
            description: "Currently processing project video and extracting frames. Be aware that this might take a while depending on the input.",
          }
        }

        const identifier = `${(values.filename as string).replaceAll("/", encodeURIComponent("/"))}-${values.frameRate}-${values.scale}-${values.from}-${values.to}`
        await listenToProgress("create-stack", identifier, data => {
          updateProgress(data)
          if(data.CurrentStep !== data.MaxSteps) return

          serverRevalidateTag("projects")
        }).then(async () => {
          await createStack(values)
          isCreateStackDrawerOpen.value = false
          await form.reset()
        })
      }
    })
  }, [])

  return (
    <DialogSignal
      open={isCreateStackDrawerOpen}
      onOpenChange={newOpen => {
        isCreateStackDrawerOpen.value = newOpen
        if(!newOpen) createStackForm.reset()
      }}
    >
      <DialogContent className="absolute max-w-3xl">
      <form
        onSubmit={async e => {
          e.preventDefault()

          void form.handleSubmit()
        }}
      >
        <DialogHeader>
          <DialogTitle>Create new Stack</DialogTitle>
          <DialogDescription>Here you can split a project file into several frames.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-1">
          <form.FieldProvider name="filename" defaultValue={selectedProject && getProjectFile(selectedProject)}>
            <Label>Project</Label>
          <SelectForm>
            <SelectTrigger>
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              {
                projects.map(project => (
                  <SelectItem
                    key={project.name}
                    value={getProjectFile(project)}
                  >
                    {project.name}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </SelectForm>
            </form.FieldProvider>

          <form.FieldProvider
            name="scale"
            validator={z.number().int().min(1) as any}
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
          validator={z.number().int().min(1) as any}
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
          <div className="flex flex-row gap-1">
            <form.FieldProvider
              name="from"
              validator={z.string().time().or(z.literal("")).refine(validateTimeStringLessThan(srcVideo.value?.duration), "The timestamp must be less than the video duration") as any}
            >
              <div className="flex-1">
                <Label>From timestamp <i className="text-muted-foreground">(format: HH:mm:ss)</i></Label>
                <InputForm
                  type="time"
                  placeholder="Type here..."
                  step="1"
                  className="block"
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
                ]).refine(([to, from]) => (!to || to !== from) && validateTimeStringLessThan(to)(from), "The 'to' timestamp must be greater than the 'from' timestamp") as any
              }
              validateMixin={["from"]}
            >
              <div className="flex-1">
                <Label>To timestamp <i className="text-muted-foreground">(format: HH:mm:ss)</i></Label>
                <InputForm
                  type="time"
                  placeholder="Type here..."
                  step="1"
                  className="block"
                />
                <ErrorText/>
              </div>
            </form.FieldProvider>
          </div>

          <form.FormProvider>
            <ErrorTextForm/>
          </form.FormProvider>
        </div>

      <DialogFooter className="mt-4">
        <Button
          type="submit"
          disabled={!form.canSubmit.value}
        >
          Create Stack
        </Button>
        <DrawerClose asChild>
          <Button
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        </DrawerClose>
      </DialogFooter>
      </form>
      </DialogContent>
    </DialogSignal>
  )
}