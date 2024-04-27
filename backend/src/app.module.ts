import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {EnvModule} from './env/env.module';
import {ConfigModule} from '@nestjs/config';
import {envSchema} from "./env/env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envs => envSchema.parse(envs)
    }),
    EnvModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
