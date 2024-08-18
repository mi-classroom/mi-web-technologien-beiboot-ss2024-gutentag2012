"use client";

import { cn } from "@/lib/utils";
import { signal, useComputed } from "@preact/signals-react";
import { useLayoutEffect, useRef } from "react";

const loadedImages = signal<string[]>([]);
const runningLoadingDebounce = new Map<string, number>();

// This is needed, since the IntersectionObserver does not exist on the server
let loadingDebounceListener = null as null | IntersectionObserver;
if (typeof window !== "undefined") {
	loadingDebounceListener = new IntersectionObserver(
		(entries, observer) => {
			for (const entry of entries) {
				const id = entry.target.id;
				if (!entry.isIntersecting) {
					const timeout = runningLoadingDebounce.get(id);
					if (!timeout) continue;

					clearTimeout(timeout);
					runningLoadingDebounce.delete(id);
					continue;
				}

				const debounceLoading = window.setTimeout(() => {
					const img = entry.target as HTMLImageElement;
					img.src = img.dataset.src as string;
					img.addEventListener("load", () => {
						loadedImages.value = [...loadedImages.peek(), id];
						observer.unobserve(img);
						runningLoadingDebounce.delete(id);
					});
				}, 200);
				runningLoadingDebounce.set(id, debounceLoading);
			}
		},
		{
			root: null,
			rootMargin: "0px",
			threshold: 0,
		} as IntersectionObserverInit,
	);
}

export function LazyImage({
	src,
	className,
	...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
	const ref = useRef<HTMLImageElement | null>();

	const opacity = useComputed(() => {
		if (!props.id) return "opacity-100";
		return loadedImages.value.includes(props.id) ? "opacity-100" : "opacity-0";
	});

	useLayoutEffect(() => {
		if (!ref.current || !loadingDebounceListener) return;

		const img = ref.current as HTMLImageElement;
		loadingDebounceListener.observe(img);
		return () => {
			if (!loadingDebounceListener) return;
			loadingDebounceListener.unobserve(img);
		};
	}, []);

	return (
		<img
			ref={(r) => {
				ref.current = r;
			}}
			{...props}
			data-src={src}
			className={cn(opacity.value, "transition-opacity", className)}
			loading="lazy"
			alt={props.alt}
		/>
	);
}
