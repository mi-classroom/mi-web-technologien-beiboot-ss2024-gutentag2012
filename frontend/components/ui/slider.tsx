"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";
import { unSignalifyValueSubscribed } from "@formsignals/form-core";
import { useFieldContext } from "@formsignals/form-react";
import type { Signal } from "@preact/signals-react";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.PropsWithChildren<
		React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
			handles?: number;
		}
	>
>(({ className, handles, children, ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			"relative flex w-full touch-none select-none items-center",
			className,
		)}
		{...props}
	>
		<SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
			<SliderPrimitive.Range className="absolute h-full bg-primary" />
		</SliderPrimitive.Track>
		{children}
		{Array.from({ length: handles ?? 1 }, (_, i) => (
			<SliderPrimitive.Thumb
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				key={i}
				className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
			/>
		))}
		{/*<SliderPrimitive.Thumb className="block relative h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">*/}
		{/* TODO This could be a way to show a tooltip here */}
		{/*<div className="bg-card-foreground text-card rounded p-1 absolute translate-y-[-36px] translate-x-[-25%]">*/}
		{/*  {props.value}*/}
		{/*</div>*/}
		{/*</SliderPrimitive.Thumb>*/}
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

interface SliderSignalProps
	extends Omit<
		React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
		"value"
	> {
	value?: Signal<number[]>;
}

const SliderSignal = ({ value, ...props }: SliderSignalProps) => {
	return <Slider value={value?.value} {...props} />;
};

/**
 * @useSignals
 */
const SliderForm = ({
	onValueChange,
	...props
}: Omit<SliderSignalProps, "value">) => {
	const field = useFieldContext<number[], "">();
	return (
		<Slider
			value={unSignalifyValueSubscribed(field.data)}
			onValueChange={onValueChange}
			handles={field.data.value.length}
			{...props}
		/>
	);
};
SliderForm.displayName = "SliderForm";

export { Slider, SliderSignal, SliderForm };
