import {useFieldContext, useFormContext} from "@formsignals/form-react";

export function ErrorText() {
  const field = useFieldContext()
  const errors = field.errors.value.join(", ")
  if(!errors) return null
  return (
    <p className="text-xs bg-destructive rounded-sm px-2 py-1 text-destructive-foreground mt-0.5">{errors}</p>
  )
}
export function ErrorTextForm() {
  const form = useFormContext()
  const errors = form.errors.value.join(", ")
  if(!errors) return null
  return (
    <p className="text-xs bg-destructive rounded-sm px-2 py-1 text-destructive-foreground mt-0.5">{errors}</p>
  )
}