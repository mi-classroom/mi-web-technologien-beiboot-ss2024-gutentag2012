import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import {unSignalifyValueSubscribed, useFieldContext} from "@formsignals/form-react";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.PropsWithChildren<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {handles?: number}>
>(({ className, children, handles, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    {children}
    {
      Array.from({length: handles ?? 1}, (_, i) => (
        <SliderPrimitive.Thumb key={i} className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
      ))
    }
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

interface SliderSignalProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value"> {
}

/**
 * @useSignals
 */
const SliderForm = ({ onValueChange, ...props }: SliderSignalProps) => {
  const field = useFieldContext<number[], "">()
  return (
    <Slider
      value={unSignalifyValueSubscribed(field.data)}
      onValueChange={onValueChange}
      handles={field.data.value.length}
      {...props}
    />
  )
}
SliderForm.displayName = "SliderSignal"

export { Slider, SliderForm }
