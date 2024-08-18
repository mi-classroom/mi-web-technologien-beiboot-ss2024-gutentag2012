import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const GenerateImageSchema = z.object({
	frames: z
		.array(z.number())
		.min(2)
		.refine((v) => v.length % 2 === 0, {
			message: "Frames must be in pairs",
		})
		.refine((v) => v.some((v, i, arr) => i === 0 || v >= arr[i - 1]), {
			message: "Frames must be in ascending order",
		}),
	weights: z
		.array(z.number())
		.min(1)
		.refine((v) => v.every((v) => v >= 1), {
			message: "Weights must be greater than 0",
		}),
});

export class GenerateImageDto extends createZodDto(GenerateImageSchema) {}
