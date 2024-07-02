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
import { ImageResultModule } from './image-result/image-result.module';
import {EventEmitterModule} from "@nestjs/event-emitter";
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envs => envSchema.parse(envs)
    }),
    EventEmitterModule.forRoot({
      global: true
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
      useClass: ZodValidationPipe
    }
  ]
})
export class AppModule {
}
