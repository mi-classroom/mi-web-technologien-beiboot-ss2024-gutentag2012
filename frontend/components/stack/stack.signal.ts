import { FormLogic } from "@formsignals/form-react";
import {
	type ZodAdapter,
	configureZodAdapter,
} from "@formsignals/validation-adapter-zod";
import { signal } from "@preact/signals-react";

export const isCreateStackDrawerOpen = signal(false);

type CreateStackFormValues = {
	scale: number;
	from: string;
	name: string;
	to: string;
	frameRate: number;
	projectId?: string;
};

export const createStackForm = new FormLogic<
	CreateStackFormValues,
	typeof ZodAdapter
>({
	validatorAdapter: configureZodAdapter({
		takeFirstError: true,
	}),
});
createStackForm.mount();
