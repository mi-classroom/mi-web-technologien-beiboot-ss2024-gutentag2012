"use client";

import {
	type Signal,
	effect,
	signal,
	useComputed,
	useSignal,
} from "@preact/signals-react";
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

type ProcessingJob = {
	status: "queued" | "processing" | "done" | "error";
	totalSteps: number;
	currentStep: number;
	stepTimestamps: number[];
};

type ProgressDialogProps = {
	label: string;
	description: string;
	pendingMessage: string;
	messages: string[];
	onDone?: () => void;
	progressData: Signal<ProcessingJob | undefined>;
	isOpen: Signal<boolean>;
};

export function useProgressDialog(
	options: Omit<ProgressDialogProps, "progressData" | "isOpen">,
) {
	const isOpen = useSignal(false);
	const progressData = useSignal<ProcessingJob | undefined>(undefined);
	return {
		isOpen,
		data: progressData,
		ProgressDialog: () => (
			<ProgressDialog
				isOpen={isOpen}
				label={options.label}
				description={options.description}
				messages={options.messages}
				pendingMessage={options.pendingMessage}
				progressData={progressData}
			/>
		),
	};
}

const now = signal(Date.now());
effect(() => {
	const nowInterval = setInterval(() => {
		now.value = Date.now();
	}, 10);
	return () => clearInterval(nowInterval);
});

export function ProgressDialog({
	label,
	description,
	messages,
	progressData,
	isOpen,
	onDone,
	pendingMessage,
}: ProgressDialogProps) {
	const isDone = useComputed(() => progressData.value?.status === "done");

	const timeDifferences = useComputed(() => {
		if (!progressData.value) return [];
		const currentSteps = progressData.value.stepTimestamps;
		const timeDifferences = currentSteps.reduce((acc, curr, i) => {
			if (i === 0) return acc;
			acc.push(curr - currentSteps[i - 1]);
			return acc;
		}, [] as number[]);
		if (!isDone.value) {
			timeDifferences.push(now.value - currentSteps[currentSteps.length - 1]);
		}
		return timeDifferences;
	});

	const totalTime =
		timeDifferences.value.reduce((acc, curr) => acc + curr, 0) ?? 0;
	const currentTimer = useComputed(() => {
		const n = now.value;
		if (isDone.value) return (totalTime / 1000).toFixed(2);

		const lastTimeValues = progressData.value?.stepTimestamps ?? [0];
		const lastTimeValue = lastTimeValues[lastTimeValues.length - 1];
		return lastTimeValue && ((n - lastTimeValue) / 1000).toFixed(2);
	});

	const currentProgress = useComputed(() => {
		if (!progressData.value || progressData.value?.status === "queued")
			return 0;
		return (
			(progressData.value.currentStep / progressData.value.totalSteps) * 100
		);
	});

	return (
		<AlertDialog open={isOpen.value}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{label}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<Progress value={currentProgress.value} />
				{progressData.value?.status === "queued" && (
					<>
						<p className="text-sm text-muted-foreground italic text-right">
							{pendingMessage}
						</p>
					</>
				)}
				<div className="flex flex-col gap-1">
					{progressData.value?.status !== "queued" &&
						timeDifferences.value.map((time, i) => (
							<div className="flex justify-between" key={time}>
								<p className="text-sm text-muted-foreground italic">
									{messages[i]}
								</p>
								<p className="text-sm font-semibold text-muted-foreground">
									{time !== null ? (time / 1000).toFixed(2) : currentTimer}s
								</p>
							</div>
						))}
					{isDone.value && (
						<div className="flex justify-between">
							<p className="text-sm text-muted-foreground italic">Total time</p>
							<p className="text-sm font-semibold text-muted-foreground">
								{(totalTime / 1000).toFixed(2)}s
							</p>
						</div>
					)}
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => {
							isOpen.value = false;
						}}
					>
						{!isDone.value ? "Send to Background" : "Close"}
					</AlertDialogCancel>
					{onDone && (
						<AlertDialogAction
							disabled={!isDone.value}
							onClick={() => {
								if (onDone) {
									onDone();
								}
								isOpen.value = false;
								progressData.value = undefined;
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
