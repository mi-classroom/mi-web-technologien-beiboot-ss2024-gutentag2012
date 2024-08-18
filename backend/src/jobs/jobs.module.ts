import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";

@Module({
	controllers: [JobsController],
	providers: [JobsService],
	imports: [DatabaseModule],
})
export class JobsModule {}
