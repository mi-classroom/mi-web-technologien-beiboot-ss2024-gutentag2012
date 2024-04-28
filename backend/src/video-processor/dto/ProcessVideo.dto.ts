import {z} from "zod";
import {createZodDto} from "nestjs-zod";

export const ProcessVideoSchema = z.object({
  filename: z.string().min(1),
  scale: z.number().min(-1).optional().default(-1),
  frameRate: z.number().min(-1).optional().default(-1),
  fromFrame: z.number().min(-1).optional().default(-1),
  toFrame: z.number().min(-1).optional().default(-1),
}).strict().refine(data => data.fromFrame && data.toFrame ? data.toFrame >= data.fromFrame : true, "The toFrame must be greater than fromFrame");

export class ProcessVideoDto extends createZodDto(ProcessVideoSchema) {
}