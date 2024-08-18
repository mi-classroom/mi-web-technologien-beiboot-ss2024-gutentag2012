import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateProjectSchema = z.object({
	name: z.string().min(3),
	isPublic: z.coerce.boolean(),
});

export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}
