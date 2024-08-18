import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Put,
	Query,
	Res,
} from "@nestjs/common";
import { Response } from "express";
import { ProcessingJobSelect } from "../database/schema";
import { ProgressMessageDto } from "./dto/ProgressMessage.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
	constructor(private readonly jobsService: JobsService) {}

	@Put(":id")
	@HttpCode(HttpStatus.OK)
	async updateJob(@Param("id") id: number, @Body() data: ProgressMessageDto) {
		return this.jobsService.updateJob(id, data);
	}

	@Get("/:id")
	async getJobData(@Param("id") id: number, @Res() response: Response) {
		response.writeHead(200, {
			"Cache-Control": "no-cache",
			"Content-Type": "text/event-stream",
			Connection: "keepalive",
		});
		response.flushHeaders();

		const currentData = await this.jobsService.getJobData(id);
		response.write(`event:initial\ndata:${JSON.stringify(currentData)}\n\n`);

		const onEvent = (data: ProcessingJobSelect) => {
			response.write(`event:progress\ndata:${JSON.stringify(data)}\n\n`);
			if (data.status === "done") response.end();
		};

		this.jobsService.listenToJob(id, onEvent);
		response.on("close", () =>
			this.jobsService.stopListeningToJob(id, onEvent),
		);
	}
}
