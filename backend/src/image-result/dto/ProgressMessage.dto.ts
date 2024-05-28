import {z} from "zod";
import {createZodDto} from "nestjs-zod";

export const ProgressMessageSchema = z.object({
  Event: z.string().min(1),
  Identifier: z.string().min(1),
  CurrentStep: z.number(),
  MaxSteps: z.number(),
  Message: z.string(),
});

export class ProgressMessageDto extends createZodDto(ProgressMessageSchema) {
}