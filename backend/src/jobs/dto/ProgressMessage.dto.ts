import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ProgressMessageSchema = z.object({
	Status: z.union([
		z.literal("queued"),
		z.literal("processing"),
		z.literal("done"),
		z.literal("error"),
	]),
	CurrentStep: z.number(),
	MaxSteps: z.number(),
	Timestamp: z.number(),
});

export class ProgressMessageDto extends createZodDto(ProgressMessageSchema) {}
