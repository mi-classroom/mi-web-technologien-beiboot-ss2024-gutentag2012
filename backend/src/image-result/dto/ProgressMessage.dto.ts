import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ProgressMessageSchema = z.object({
	Event: z.string().min(1),
	Identifier: z.string().min(1),
	CurrentStep: z.number(),
	MaxSteps: z.number(),
	Message: z.string(),
});

export class ProgressMessageDto extends createZodDto(ProgressMessageSchema) {}
