import { Module } from "@nestjs/common";
import { AmqpClientModule } from "../amqp-client/amqp-client.module";
import { DatabaseModule } from "../database/database.module";
import { MinioClientModule } from "../minio-client/minio-client.module";
import { StackModule } from "../stack/stack.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import {EnvModule} from "../env/env.module";

@Module({
	controllers: [ProjectsController],
	providers: [ProjectsService],
	imports: [MinioClientModule, DatabaseModule, AmqpClientModule, StackModule, EnvModule],
})
export class ProjectsModule {}
