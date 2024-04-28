import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {EnvService} from "./env/env.service";
import { Logger } from '@nestjs/common/services';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envService = app.get(EnvService);

  app.enableCors()

  await app.listen(envService.get("PORT"));
  Logger.log(`Server running on port :${envService.get("PORT")}`);
}
bootstrap();
