import {signal} from "@preact/signals-react";
import {FormLogic, useForm} from "@formsignals/form-react";
import {ZodAdapter} from "@formsignals/validation-adapter-zod";

export const isCreateStackDrawerOpen = signal(false)

type CreateStackFormValues = {
  scale: number
  from: string
  to: string
  frameRate: number
  filename?: string
}

export const createStackForm = new FormLogic<CreateStackFormValues, typeof ZodAdapter>({
  validatorAdapter: ZodAdapter
})
createStackForm.mount()