import { Module } from "@nestjs/common";
import { MinioModule } from "nestjs-minio-client";
import { EnvService } from "../env/env.service";
import { MinioClientService } from "./minio-client.service";

@Module({
	imports: [
		MinioModule.registerAsync({
			useFactory: async (envService: EnvService) => ({
				endPoint: envService.get("MINIO_ENDPOINT"),
				port: envService.get("MINIO_PORT"),
				useSSL: false,
				accessKey: envService.get("MINIO_ACCESS_KEY"),
				secretKey: envService.get("MINIO_SECRET_KEY"),
			}),
			inject: [EnvService],
		}),
	],
	providers: [MinioClientService],
	exports: [MinioClientService],
})
export class MinioClientModule {}
