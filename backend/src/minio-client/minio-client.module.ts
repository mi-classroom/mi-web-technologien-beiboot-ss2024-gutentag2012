import {Module} from '@nestjs/common';
import {MinioClientService} from './minio-client.service';
import {MinioModule} from "nestjs-minio-client";
import {EnvService} from "../env/env.service";
import {EnvModule} from "../env/env.module";

@Module({
  imports: [
    MinioModule.registerAsync({
      imports: [EnvModule],
      useFactory: async (envService: EnvService) => ({
        endPoint: envService.get('MINIO_ENDPOINT'),
        port: envService.get('MINIO_PORT'),
        useSSL: false,
        accessKey: envService.get('MINIO_ACCESS_KEY'),
        secretKey: envService.get('MINIO_SECRET_KEY')
      }),
      inject: [EnvService],
    }),
  ],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioClientModule {
}
