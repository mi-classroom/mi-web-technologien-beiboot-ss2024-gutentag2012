import { z } from "zod";

export const envSchema = z.object({
	PORT: z.coerce.number().optional().default(3000),
	MINIO_ENDPOINT: z.string().min(1),
	MINIO_PORT: z.coerce.number(),
	MINIO_BUCKET_NAME: z.string().min(1),
	MINIO_ACCESS_KEY: z.string().min(1),
	MINIO_SECRET_KEY: z.string().min(1),
	RABBITMQ_URL: z.string().min(1),
	DB_URL: z.string().min(1),
	MAX_STORAGE_GB: z.coerce.number().min(1),
});

export type Env = z.infer<typeof envSchema>;
