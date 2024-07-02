import {unSignalifyValueSubscribed, useFieldContext} from "@formsignals/form-react";
import {useComputed} from "@preact/signals-react";

/**
 * @useSignals
 */
export const FrameBlockers = ({max}: { max: number }) => {
  const field = useFieldContext<number[], "">()

  const blockerPoints = useComputed(() => {
    const data = unSignalifyValueSubscribed(field.data)

    return data.reduce((acc, v, i, arr) => {
      if (i === 0 || i >= arr.length - 1 || i % 2 === 0) return acc
      acc.push([
        v / max * 100,
        arr[i + 1] / max * 100
      ])
      return acc
    }, [] as [number, number][])
  })

  return (
    blockerPoints.value.map(([left, right], i) => (
      <div
        key={i}
        className="absolute bg-[var(--primary-20)] h-[6px] top-0"
        style={{left: `${left}%`, right: `${100 - right}%`}}
      />
    ))
  )
}