import {Module} from '@nestjs/common';
import {EnvModule} from './env/env.module';
import {ConfigModule} from '@nestjs/config';
import {envSchema} from "./env/env";
import { MinioClientModule } from './minio-client/minio-client.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { VideoProcessorModule } from './video-processor/video-processor.module';
import { AmqpClientModule } from './amqp-client/amqp-client.module';
import {APP_PIPE} from "@nestjs/core";
import {ZodValidationPipe} from "nestjs-zod";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envs => envSchema.parse(envs)
    }),
    EnvModule,
    MinioClientModule,
    FileUploadModule,
    AmqpClientModule,
    VideoProcessorModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe
    }
  ]
})
export class AppModule {
}
