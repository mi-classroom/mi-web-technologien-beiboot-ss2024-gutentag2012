import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ZodValidationPipe } from "nestjs-zod";
import { AmqpClientModule } from "./amqp-client/amqp-client.module";
import { envSchema } from "./env/env";
import { EnvModule } from "./env/env.module";
import { FileUploadModule } from "./file-upload/file-upload.module";
import { ImageResultModule } from "./image-result/image-result.module";
import { MinioClientModule } from "./minio-client/minio-client.module";
import { ProjectsModule } from "./projects/projects.module";
import { RequestLoggerMiddleware } from "./request-logger.middleware";
import { VideoProcessorModule } from "./video-processor/video-processor.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: (envs) => envSchema.parse(envs),
		}),
		EventEmitterModule.forRoot({
			global: true,
		}),
		EnvModule,
		MinioClientModule,
		FileUploadModule,
		AmqpClientModule,
		VideoProcessorModule,
		ImageResultModule,
		ProjectsModule,
	],
	providers: [
		{
			provide: APP_PIPE,
			useClass: ZodValidationPipe,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestLoggerMiddleware).forRoutes("*");
	}
}
