import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Post,
} from "@nestjs/common";
import { CreateStackDto } from "./dto/CreateStack.dto";
import { GenerateImageDto } from "./dto/GenerateImage.dto";
import { StackService } from "./stack.service";

@Controller("stack")
export class StackController {
	constructor(private readonly stackService: StackService) {}

	@Post()
	createStack(@Body() data: CreateStackDto) {
		return this.stackService.createStack(data);
	}

	@Get("/available")
	getAvailableStacks() {
		return this.stackService.getAvailableStacks();
	}

	@Get(":id")
	getStack(@Param("id") id: number) {
		return this.stackService.getStack(id);
	}

	@Post(":id/generate")
	generateImageForStack(
		@Param("id") id: number,
		@Body() data: GenerateImageDto,
	) {
		return this.stackService.generateImageForStack(id, data);
	}

	@Delete("/image/:id")
	deleteStackImage(@Param("id") id: number) {
		return this.stackService.deleteStackImage(id);
	}

	@Delete(":id")
	deleteStack(@Param("id") id: number) {
		return this.stackService.deleteStack(id);
	}
}
