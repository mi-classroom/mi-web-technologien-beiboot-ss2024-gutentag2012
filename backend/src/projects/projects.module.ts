import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import {MinioClientModule} from "../minio-client/minio-client.module";

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  imports: [MinioClientModule]
})
export class ProjectsModule {}
