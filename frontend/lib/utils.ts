import { getPublicApiUrl, getServerApiUrl } from "@/lib/env";
import type { Project } from "@/lib/repos/project.repo";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const SLASH = encodeURIComponent("/");

export function getImagePath(...parts: string[]) {
	const combined = parts
		.filter(Boolean)
		.map((e) => e?.replace(/\/$/, "").replaceAll("/", SLASH))
		.join(SLASH);

	return `/media/file-upload/get/${combined}`;
}

export function getProjectFile(project: Project) {
	return project.otherFiles.find((file) => file.includes("/input.")) ?? "";
}

export function parseXhrResponse(xhr: XMLHttpRequest) {
	if (!xhr.responseText) return null;
	if (xhr.getResponseHeader("Content-Type")?.includes("application/json")) {
		try {
			return JSON.parse(xhr.responseText);
		} catch {
			return xhr.responseText;
		}
	}
	return xhr.responseText;
}

export function validateTimeStringLessThan(duration?: string | null) {
	return (value?: string | null) => {
		if (!duration || !value) return true;

		const [hoursCompare, minutesCompare, secondsCompare] = duration
			.split(":")
			.map((v) => Number.parseInt(v));
		const [hours, minutes, seconds] = value
			.split(":")
			.map((v) => Number.parseInt(v));

		if (hours > hoursCompare) return false;
		if (hours === hoursCompare && minutes > minutesCompare) return false;
		return !(
			hours === hoursCompare &&
			minutes === minutesCompare &&
			seconds > secondsCompare
		);
	};
}
