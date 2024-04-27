import { z } from "zod";
export declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    PORT: number;
}, {
    PORT?: number | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
