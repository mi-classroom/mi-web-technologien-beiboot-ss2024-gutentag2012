import { getServerApiUrl } from "@/lib/env";

type ProcessingJob = {
	id: number;
	type: "createStack" | "generateImage" | "processProject";
	status: "queued" | "processing" | "done" | "error";
	totalSteps: number;
	currentStep: number;
	stepTimestamps: number[];
};

export function listenToJob(
	jobId: number,
	onProgress: (data: ProcessingJob) => void,
) {
	const eventSource = new EventSource(`${getServerApiUrl()}/jobs/${jobId}`);
	eventSource.addEventListener("initial", (e) =>
		onProgress(JSON.parse(e.data)),
	);
	eventSource.addEventListener("progress", (e) =>
		onProgress(JSON.parse(e.data)),
	);
	return new Promise((r) => {
		eventSource.onopen = () => r(undefined);
	});
}

export function getMemoryUsage(): Promise<{
	totalUsage: number;
	maxUsage: number;
}> {
	return fetch(`${getServerApiUrl()}/projects/total-memory`).then((res) =>
		res.json(),
	);
}
