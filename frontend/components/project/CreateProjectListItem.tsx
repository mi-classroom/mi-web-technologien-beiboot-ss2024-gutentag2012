"use client";

import {createProjectForm, isCreateProjectDrawerOpen} from "@/components/project/project.signals";
import {FileUploadField} from "@/components/functional/FileUploadFIeld";

export function CreateProjectListItem() {
  return (
    <div
      className="bg-card text-card-foreground rounded-lg h-64"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        isCreateProjectDrawerOpen.value = true
      }}
    >
    <FileUploadField
      file={createProjectForm.data.peek().projectFile}
      className="rounded-lg bg-transparent"
      title="Create new Project"
      description="Click to open or drag video file here"
      onChange={file => {
        createProjectForm.data.peek().projectFile.value = file
        isCreateProjectDrawerOpen.value = true
      }}
    />
    </div>
  )
}