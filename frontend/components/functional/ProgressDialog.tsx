"use client";

import { effect, signal, useComputed } from "@preact/signals-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { Progress } from "../ui/progress";

type ProgressFrame = {
	CurrentStep: number;
	MaxSteps: number;
	Message: string;

	options: {
		label: string;
		description: string;
		onDone?: () => void;
	};
};

const now = signal(Date.now());
effect(() => {
	const nowInterval = setInterval(() => {
		now.value = Date.now();
	}, 10);
	return () => clearInterval(nowInterval);
});

const progressDialogDataHistory = signal<[string | undefined, number | null][]>(
	[],
);
const lastTime = signal<number | null>(null);
export const progressDialogData = signal<ProgressFrame | null>(null);

effect(() => {
	if (progressDialogData.value) return;
	progressDialogDataHistory.value = [];
});

export function updateProgress(progress: Omit<ProgressFrame, "options">) {
	if (!progressDialogData.peek()) return;

	const currentTimeHistory = progressDialogDataHistory.peek();
	if (currentTimeHistory.length > 0) {
		for (let i = 0; i < (progress.CurrentStep + 1 ?? 0); i++) {
			if (!currentTimeHistory[i] || currentTimeHistory[i][1] !== null) {
				continue;
			}

			currentTimeHistory[i][1] = Math.max(
				0,
				now.peek() - (lastTime.peek() ?? 0),
			);
		}
	}

	const isFinished = progress?.CurrentStep === progress?.MaxSteps;
	const currentValue = isFinished
		? progressDialogDataHistory
				.peek()
				.reduce((acc, [_, time]) => acc + (time ?? 0), 0)
		: null;

	progressDialogDataHistory.value = [
		...currentTimeHistory,
		[progress?.Message, currentValue],
	];
	lastTime.value = isFinished ? null : Date.now();

	progressDialogData.value = {
		...progress,
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		options: progressDialogData.peek()?.options!,
	};
}

export function ProgressDialog() {
	const currentTimer = useComputed(
		() => lastTime.value && ((now.value - lastTime.value) / 1000).toFixed(2),
	);

	return (
		<AlertDialog open={progressDialogData.value !== null}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{progressDialogData.value?.options?.label}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{progressDialogData.value?.options?.description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{progressDialogData.value && (
					<Progress
						value={
							(progressDialogData.value?.CurrentStep /
								progressDialogData.value?.MaxSteps) *
							100
						}
					/>
				)}
				<div className="flex flex-col gap-1">
					{progressDialogDataHistory.value.map(([message, time]) => (
						<div className="flex justify-between" key={message}>
							<p className="text-sm text-muted-foreground italic">{message}</p>
							<p className="text-sm font-semibold text-muted-foreground">
								{time !== null ? (time / 1000).toFixed(2) : currentTimer}s
							</p>
						</div>
					))}
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => {
							progressDialogData.value = null;
						}}
					>
						{!progressDialogData.value ||
						progressDialogData.value?.CurrentStep !==
							progressDialogData.value?.MaxSteps
							? "Send to Background"
							: "Close"}
					</AlertDialogCancel>
					{progressDialogData.value?.options?.onDone && (
						<AlertDialogAction
							disabled={
								!progressDialogData.value ||
								progressDialogData.value?.CurrentStep !==
									progressDialogData.value?.MaxSteps
							}
							onClick={() => {
								const onDone = progressDialogData.peek()?.options?.onDone;
								if (onDone) {
									onDone();
								}
								progressDialogData.value = null;
							}}
						>
							Done
						</AlertDialogAction>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
