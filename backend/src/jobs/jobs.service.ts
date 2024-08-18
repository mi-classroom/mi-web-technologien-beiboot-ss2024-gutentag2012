import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { DATABASE } from "../database/database.provider";
import * as schema from "../database/schema";
import { ProcessingJobSelect } from "../database/schema";
import { ProgressMessageDto } from "./dto/ProgressMessage.dto";

@Injectable()
export class JobsService {
	constructor(
		private readonly eventEmitter: EventEmitter2,
		@Inject(DATABASE) private readonly db: LibSQLDatabase<typeof schema>,
	) {}

	async updateJob(id: number, data: ProgressMessageDto) {
		const res = await this.db
			.update(schema.ProcessingJobs)
			.set({
				status: data.Status,
				currentStep: data.CurrentStep,
				totalSteps: data.MaxSteps,
				stepTimestamps: sql`json_insert(${schema.ProcessingJobs.stepTimestamps}, '$[#]', ${data.Timestamp})`,
			})
			.where(eq(schema.ProcessingJobs.id, id))
			.returning();
		const currentData = await this.getJobData(id);

		this.eventEmitter.emit(`job-${id}`, currentData);

		return { success: true };
	}

	async getJobData(id: number) {
		return await this.db.query.ProcessingJobs.findFirst({
			where: eq(schema.ProcessingJobs.id, id),
		});
	}

	listenToJob(id: number, callback: (data: ProcessingJobSelect) => void) {
		this.eventEmitter.on(`job-${id}`, callback);
	}

	stopListeningToJob(
		id: number,
		callback: (data: ProcessingJobSelect) => void,
	) {
		this.eventEmitter.off(`job-${id}`, callback);
	}
}
