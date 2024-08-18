import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const UpdateMetaSchema = z.object({
	MaxWidth: z.number().min(1),
	MaxHeight: z.number().min(1),
	MaxFrameRate: z.number().min(1),
	Duration: z.number().min(1),
});

export class UpdateMetaDto extends createZodDto(UpdateMetaSchema) {}
