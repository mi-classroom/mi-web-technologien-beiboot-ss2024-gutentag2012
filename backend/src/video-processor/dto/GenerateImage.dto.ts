import {z} from "zod";
import {createZodDto} from "nestjs-zod";

export const GenerateImageSchema = z.object({
  project: z.string().min(1),
  stack: z.string().min(1),
  frames: z.array(z.number()).min(2).refine(v => v.length % 2 === 0, {
    message: "Frames must be in pairs"
  }).refine(v => v.some((v, i, arr) => i === 0 || v >= arr[i - 1]), {
    message: "Frames must be in ascending order"
  }),
});

export class GenerateImageDto extends createZodDto(GenerateImageSchema) {
}