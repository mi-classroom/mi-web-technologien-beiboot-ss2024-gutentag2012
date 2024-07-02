"use client";

import {
  Drawer, DrawerClose,
  DrawerContent,
  DrawerDescription, DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {createProjectForm, isCreateProjectDrawerOpen} from "@/components/project/project.signals";
import {useRouter} from "next/navigation";
import {FileUploadField} from "@/components/functional/FileUploadFIeld";
import {Label} from "@/components/ui/label";
import {Paths, useFormWithComponents, ValueAtPath} from "@formsignals/form-react";
import {ErrorText} from "@/components/functional/ErrorText";
import {InputForm} from "@/components/ui/input";
import {useFileUpload} from "@/lib/hooks/useFileUpload";
import {serverRevalidateTag} from "@/lib/serverRevalidateTag";
import {getAllProjects} from "@/lib/project.repo";
import {generateImageForm, isGenerateImageDrawerOpen} from "@/components/image/image.signal";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSignal,
  DialogTitle
} from "@/components/ui/dialog";

export function CreateProjectFormDialog() {
  const router = useRouter()
  const form = useFormWithComponents(createProjectForm)
  const fileUpload = useFileUpload(createProjectForm.data.peek().projectFile)

  return (
    <DialogSignal
      open={isCreateProjectDrawerOpen}
      onOpenChange={newOpen => {
        isCreateProjectDrawerOpen.value = newOpen
        if(!newOpen) createProjectForm.reset()
      }}
    >
        <DialogContent className="absolute max-w-3xl">
          <form
            onSubmit={async e => {
              e.preventDefault()
              const values = createProjectForm.json.peek()
              isCreateProjectDrawerOpen.value = false

              await fileUpload.uploadFile([
                ["prefix", values.prefix],
                ["newName", "input"]
              ])

              await serverRevalidateTag("projects")
              await form.reset()

              router.push(values.prefix)
            }}
          >
            <DialogHeader>
              <DialogTitle>Create new Project</DialogTitle>
              <DialogDescription>Here you can upload a video file to create a new Project.</DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-1">
              <form.FieldProvider
                name="prefix"
                validator={v => {
                  if (!v) return "This field is required!"
                  if (v.length < 5) return "The project name needs to be at least 5 characters long!"
                  if (v.includes("/")) return "The project name may not include a '/'!"
                  if (v.includes(" ")) return "The project name may not include a space!"
                }}
                validatorAsync={async (value) => {
                  const projects = await getAllProjects()
                  const nameTaken = projects.some(project => project.name === value)
                  if (nameTaken) return "This project name is already taken!"
                }}
                validatorAsyncOptions={{
                  disableOnChangeValidation: true
                }}
              >
                <div>
                  <Label className="mb-2 inline-block">Project Name</Label>
                  <InputForm
                    type="text"
                    placeholder="Type here..."
                  />
                  <ErrorText/>
                </div>
              </form.FieldProvider>

              <div>
                <Label className="mb-2 inline-block">Project Video File</Label>
                <FileUploadField
                  className="rounded"
                  file={createProjectForm.data.peek().projectFile}
                  shouldPreview
                  title="Upload a video file"
                  description="Click to select or drag video file here"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={!form.canSubmit.value || fileUpload.isUploading.value || fileUpload.isFileUploaded.value}
              >
                Create Project{fileUpload.progressText}
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