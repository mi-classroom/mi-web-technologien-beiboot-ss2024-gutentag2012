import {Module} from '@nestjs/common';
import {AmqpClientService} from './amqp-client.service';
import {ClientsModule, Transport} from "@nestjs/microservices";
import {AMPQ_VIDEO_PROCESSING} from "./amqp-client.constants";
import {EnvService} from "../env/env.service";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AMPQ_VIDEO_PROCESSING,
        useFactory: (envService: EnvService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [envService.get('RABBITMQ_URL')],
            queue: envService.get('VIDEO_PROCESSOR_QUEUE'),
            queueOptions: {
              durable: true,
            },
          }
       }),
        inject: [EnvService],
      }
    ])
  ],
  exports: [AmqpClientService],
  providers: [AmqpClientService]
})
export class AmqpClientModule {}
