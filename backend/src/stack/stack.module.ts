import { Module } from "@nestjs/common";
import { AmqpClientModule } from "../amqp-client/amqp-client.module";
import { DatabaseModule } from "../database/database.module";
import { MinioClientModule } from "../minio-client/minio-client.module";
import { StackController } from "./stack.controller";
import { StackService } from "./stack.service";

@Module({
	controllers: [StackController],
	providers: [StackService],
	exports: [StackService],
	imports: [MinioClientModule, DatabaseModule, AmqpClientModule],
})
export class StackModule {}
