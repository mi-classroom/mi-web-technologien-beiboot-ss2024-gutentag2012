import { Module } from "@nestjs/common";
import { ImageResultController } from "./image-result.controller";

@Module({
	controllers: [ImageResultController],
})
export class ImageResultModule {}
