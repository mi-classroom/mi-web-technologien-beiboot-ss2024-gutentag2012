import { getPublicApiUrl, getServerApiUrl } from "@/lib/env";
import type { FileUploadState } from "@/lib/hooks/useFileUpload";
import { parseXhrResponse } from "@/lib/utils";
import type { Signal } from "@preact/signals-react";

export async function uploadVideoFile(
	video: File | null,
	additionalData: Array<[string, string]> | undefined,
	status: Signal<FileUploadState>,
) {
	if (!video) return;
	const xhr = new XMLHttpRequest();

	const formData = new FormData();
	formData.append("video", video);

	if (additionalData) {
		for (const [key, value] of additionalData) {
			formData.append(key, value);
		}
	}

	return new Promise((resolve, reject) => {
		xhr.addEventListener("readystatechange", () => {
			if (xhr.readyState !== 4) return;
			const isError = xhr.status >= 400;
			const isNotSuccess = xhr.status >= 300 || xhr.status < 200;

			const response = parseXhrResponse(xhr);
			if (isError || isNotSuccess) {
				status.value = {
					state: "error",
					error: `Failed to upload file: "${response?.message ?? response}"`,
				};
				return;
			}

			status.value = {
				state: "success",
				data: {
					filename: response.filename,
					originalFilename: video.name,
				},
			};
			resolve(undefined);
		});
		xhr.addEventListener("progress", (e) => {
			status.value = {
				state: "progress",
				progress: e.loaded / e.total,
			};
		});
		xhr.addEventListener("error", () => {
			status.value = {
				state: "error",
				error: `Error uploading file: "${xhr.responseText}"`,
			};
			reject(xhr.responseText);
		});

		xhr.open("POST", `${getServerApiUrl()}/file-upload`, true);
		xhr.send(formData);
		status.value = {
			state: "progress",
			progress: 0,
		};
	});
}

export async function deleteFolder(...paths: string[]) {
	return fetch(
		`${getServerApiUrl()}/file-upload/delete/${paths.join(encodeURIComponent("/"))}`,
		{ method: "DELETE" },
	);
}
