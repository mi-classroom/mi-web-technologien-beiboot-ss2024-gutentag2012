import type {Signal} from "@preact/signals-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {FileUploadIcon} from "@/components/icons/FileUploadIcon.tsx";
import {cn} from "@/lib/utils.ts";

type UploadFieldProps = {
  file: Signal<File | null>
  className?: string
}

export const UploadField = ({file, className}: UploadFieldProps) => {
  return (
    <Label className={cn("relative w-full min-h-64 flex flex-col gap-2 items-center justify-center p-8 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20", className)}>
      <Input
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        type="file"
        accept="video/quicktime,video/mp4"
        onChange={e => file.value = e.target.files?.[0] ?? null}
      />
      {
        file.value ? (<>
          <video src={URL.createObjectURL(file.value)} controls className="max-h-72 object-cover rounded-lg"/>
          <p className="text-sm text-foreground/80 font-semibold">Selected: {file.value?.name}</p>
          <p className="text-xs text-foreground/60">Click to change or drag over</p>
        </>) : (<>
          <FileUploadIcon size={32}/>
          <div className="flex flex-col items-center">
            <p className="text-sm text-foreground/80 font-semibold">Click to upload or drag over</p>
            <p className="text-xs text-foreground/60">MOV or MP4</p>
          </div>
        </>)
      }
    </Label>
  )
}