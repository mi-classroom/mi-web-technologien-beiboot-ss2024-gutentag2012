import {Module} from '@nestjs/common';
import {AmqpClientService} from './amqp-client.service';
import {ClientsModule, Transport} from "@nestjs/microservices";
import {EnvService} from "../env/env.service";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "main-queue",
        useFactory: (envService: EnvService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [envService.get('RABBITMQ_URL')],
            queue: "main",
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
