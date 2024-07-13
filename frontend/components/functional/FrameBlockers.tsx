import {
	unSignalifyValueSubscribed,
	useFieldContext,
} from "@formsignals/form-react";
import { useComputed } from "@preact/signals-react";

/**
 * @useSignals
 */
export const FrameBlockers = ({ max, min }: { max: number; min: number }) => {
	const field = useFieldContext<number[], "">();

	const blockerPoints = useComputed(() => {
		const data = field.data ? unSignalifyValueSubscribed(field.data) : [];

		return data.reduce(
			(acc, v, i, arr) => {
				if (i === 0 || i >= arr.length - 1 || i % 2 === 0) return acc;
				const percentagePerStep = 100 / (max - min);
				const percentage = (v - min) * percentagePerStep;
				const nextPercentage = (arr[i + 1] - min) * percentagePerStep;
				acc.push([percentage, nextPercentage]);
				return acc;
			},
			[] as [number, number][],
		);
	});

	return blockerPoints.value.map(([left, right]) => (
		<div
			key={`${left}-${right}`}
			className="absolute bg-[var(--primary-20)] h-[6px] top-0"
			style={{ left: `${left}%`, right: `${100 - right}%` }}
		/>
	));
};
