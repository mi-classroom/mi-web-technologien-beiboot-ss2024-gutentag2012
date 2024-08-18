import { FormLogic } from "@formsignals/form-react";
import { signal } from "@preact/signals-react";

export const isCreateProjectDrawerOpen = signal(false);

export const createProjectForm = new FormLogic<{
	projectFile: File | null;
	prefix: string;
}>({
	defaultValues: {
		projectFile: null as File | null,
		prefix: "",
	},
});
createProjectForm.mount();
