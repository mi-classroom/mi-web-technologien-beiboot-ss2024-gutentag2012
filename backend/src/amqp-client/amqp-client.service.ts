import { Inject, Injectable } from "@nestjs/common";
import { ClientRMQ, RmqRecordBuilder } from "@nestjs/microservices";

@Injectable()
export class AmqpClientService {
	constructor(@Inject("main-queue") private readonly client: ClientRMQ) {
		this.client.connect();
	}

	async onModuleDestroy() {
		await this.client.close();
	}

	async sendMessage(queue: string, message: unknown, persistent = true) {
		const rmqRecord = new RmqRecordBuilder()
			.setData(message)
			.setOptions({ persistent })
			.build();
		this.client.emit(queue, rmqRecord);
	}
}
