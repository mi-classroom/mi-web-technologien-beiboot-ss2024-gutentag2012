import { Module } from "@nestjs/common";
import { MinioClientModule } from "../minio-client/minio-client.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
	controllers: [ProjectsController],
	providers: [ProjectsService],
	imports: [MinioClientModule],
})
export class ProjectsModule {}
