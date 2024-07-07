import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { EnvService } from "../env/env.service";
import { AmqpClientService } from "./amqp-client.service";
import {EnvModule} from "../env/env.module";

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: "main-queue",
				useFactory: (envService: EnvService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [envService.get("RABBITMQ_URL")],
						queue: "main",
						queueOptions: {
							durable: true,
						},
					},
				}),
				inject: [EnvService],
				imports: [EnvModule],
			},
		]),
	],
	exports: [AmqpClientService],
	providers: [AmqpClientService],
})
export class AmqpClientModule {}
