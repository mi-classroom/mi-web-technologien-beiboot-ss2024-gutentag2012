import {Button} from "@/components/ui/button.tsx";
import {UploadField} from "@/components/ui/UploadField.tsx";
import {useFileUpload} from "@/hooks/useFileUpload.ts";
import {InputForm} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useForm} from "@formsignals/form-react";
import {ErrorText} from "@/components/ui/ErrorText.tsx";
import {listFiles} from "@/lib/file-upload.repo.ts";

export function ProjectCreatorForm() {
  const {file, isUploading, uploadFile, progressText, isFileUploaded} = useFileUpload()
  const form = useForm({
    defaultValues: {
      prefix: "",
    },
    onSubmit: async (values) => {
      await uploadFile([
        ["prefix", values.prefix],
        ["newName", "input"]
      ])
      window.location.assign(`/project/${values.prefix}`)
    }
  })

  return (
    <div className="flex-col flex gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.FieldProvider
          name="prefix"
          validator={v => {
            if (!v) return "This field is required!"
            if (v.length < 5) return "The project name needs to be at least 5 characters long!"
            if (v.includes("/")) return "The project name may not include a '/'!"
            if (v.includes(" ")) return "The project name may not include a space!"
          }}
          validatorAsync={async (value) => {
            const currentFiles = await listFiles("root")
            const nameTaken = currentFiles.some(file => file.prefix && file.prefix.replace("/", "") === value)
            if (nameTaken) return "This project name is already taken!"
          }}
          validatorAsyncOptions={{
            disableOnChangeValidation: true
          }}
        >
          <div>
            <Label>Project Name</Label>
            <InputForm
              type="text"
              placeholder="Type here..."
            />
            <ErrorText/>
          </div>
        </form.FieldProvider>

        <UploadField
          file={file}
          className="mt-3"
        />

        <Button
          type="submit"
          className="mt-2"
          disabled={!form.isValid.value || !file.value || isUploading.value || isFileUploaded.value}
        >
          Create Project{progressText}
        </Button>
      </form>
    </div>
  )
}