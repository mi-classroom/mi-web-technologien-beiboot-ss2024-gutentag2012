import { getServerApiUrl } from "@/lib/env";

export async function createStack(values: {
	scale: number;
	from: string;
	to: string;
	frameRate: number;
	projectId: number;
}): Promise<void> {
	return fetch(`${getServerApiUrl()}/stack`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(values),
	}).then(async (res) => {
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body.message ?? "Failed to create stack");
		}
		return res.json();
	});
}

export async function deleteStack(stackId: number) {
	return fetch(`${getServerApiUrl()}/stack/${stackId}`, {
		method: "DELETE",
	});
}

export async function deleteImage(imageId: number) {
	return fetch(`${getServerApiUrl()}/stack/image/${imageId}/`, {
		method: "DELETE",
	});
}

export async function getStacksForProject(projectId: number|string) {
	return fetch(`${getServerApiUrl()}/projects/${projectId}/stacks`, {
		next: { tags: ["stacks", projectId] },
	}).then((res) => res.json());
}

export async function getAvailableStacks() {
	return fetch(`${getServerApiUrl()}/stack/available`, {
		next: { tags: ["stacks", "projects"] },
	}).then((res) => res.json()).catch(() => false);
}

export async function getStack(stackId: number) {
	return fetch(`${getServerApiUrl()}/stack/${stackId}`, {
		next: { tags: ["stacks", stackId] },
	}).then((res) => res.json());
}

export async function generateImage({
	stack,
	...values
}: {
	stack: number;
	frames: number[];
	weights: number[];
}) {
	return fetch(`${getServerApiUrl()}/stack/${stack}/generate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(values),
	}).then(async (res) => {
		if (!res.ok) {
			throw new Error(
				`Failed to create long term exposure ${JSON.stringify(await res.json())}`,
			);
		}
		return res.json();
	});
}
