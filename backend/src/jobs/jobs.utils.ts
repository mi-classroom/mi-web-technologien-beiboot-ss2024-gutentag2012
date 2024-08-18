import { ProcessingJobs } from "../database/schema";

export function isJobProcessing(job: typeof ProcessingJobs.$inferSelect) {
	return job.status === "processing" || job.status === "queued";
}
