import { FormLogic } from "@formsignals/form-react";
import { signal } from "@preact/signals-react";

export const isGenerateImageDrawerOpen = signal(false);

type GenerateImageFormValues = {
	stack: number;
	frames: number[];
	weights: number[];
};

export const generateImageForm = new FormLogic<GenerateImageFormValues>();
generateImageForm.mount();
