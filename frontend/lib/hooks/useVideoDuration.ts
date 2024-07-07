import { useSignal } from "@preact/signals-react";
import { useEffect } from "react";

type SrcVideoProps = {
	duration: string;
};

export function useVideoDuration(videoId: string) {
	const srcVideo = useSignal<SrcVideoProps | null>(null);

	useEffect(() => {
		const video = document.getElementById(videoId) as HTMLVideoElement;
		if (!video) return;
		const setDuration = () => {
			const duration = video.duration;
			const hours = `0${Math.floor(duration / 3600)}`.slice(-2);
			const minutes = `0${Math.floor(duration / 60)}`.slice(-2);
			const seconds = `0${Math.floor(duration % 60)}`.slice(-2);
			srcVideo.value = {
				duration: `${hours}:${minutes}:${seconds}`,
			};
		};

		if (Number.isNaN(video.duration)) {
			video.onloadedmetadata = setDuration;
		} else {
			setDuration();
		}
	}, [videoId, srcVideo]);

	return srcVideo;
}
