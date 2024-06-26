import * as d3 from "d3"
import {useCallback, useLayoutEffect, useState} from "react";
import {effect, useSignal} from "@preact/signals-react";
import {useField, useFormContext} from "@formsignals/form-react";

const height = 300;
const marginLeft = 8;
const marginRight = 8;
const marginTop = 20;
const marginBottom = 20;

export const WeightPicker = ({maxWeight}: { maxWeight: number }) => {
  const form = useFormContext<{ weights: number[], frames: number[] }>()
  const field = useField(form, "weights")

  const isDraggingSignal = useSignal(false)
  const rangeSignal = useSignal(1)
  const [width, setWidth] = useState(-1)

  const isFrameIncluded = useCallback((frame: number) => {
    const frames = form.json.value.frames
    return frames.some((v, i) => {
      const isStartOfPair = i % 2 === 0
      if (isStartOfPair && i + 1 < frames.length) {
        return frame >= v && frame <= frames[i + 1]
      } else if (i > 0) {
        return frame >= frames[i - 1] && frame <= v
      }
      return false
    })
  }, [form])

  useLayoutEffect(() => {
    setWidth(document.querySelector("#test")!.getBoundingClientRect().width);
  }, []);

  if (width === -1) {
    return <div
      id="test"
      style={{width: "100%"}}
    ></div>
  }

  const x = d3.scaleLinear([0, field.data.value.length - 1], [marginLeft, width - marginRight]);
  const y = d3.scaleLinear([0, maxWeight], [height - marginBottom, marginTop]);
  const line = d3.line((d, i) => x(i), y);

  function addOnDragListener(element: SVGCircleElement | null) {
    if (!element) return;
    const d3Selection = d3.select(element);

    let dragEffectUnsub: (() => void) | null = null;
    let dataBeforeDrag: number[] = [];

    const dragListener = d3.drag()
    dragListener.on("start", (e) => {
      dataBeforeDrag = field.data.peek().map(d => d.data.peek());
    })
    dragListener.on("drag", (e) => {
      if (!dataBeforeDrag.length) return;
      isDraggingSignal.value = true;
      const i = Math.round(x.invert(e.x));
      const yValue = y.invert(e.y);

      const diff = yValue - dataBeforeDrag[i];
      if (Number.isNaN(diff) || Math.abs(diff) < 0.1) return;

      if (dragEffectUnsub) (dragEffectUnsub as () => void)();
      dragEffectUnsub = effect(() => {
        field.handleChange(dataBeforeDrag.map((d, j) => {
          const distance = Math.abs(i - j);
          if (distance > rangeSignal.value) return d;
          const easInOut = Math.cos(distance * Math.PI / (2 * rangeSignal.value));
          const easedValue = Math.min(maxWeight, Math.max(1, d + diff * easInOut))
          return Math.round(easedValue);
        }))
      })
    })
    dragListener.on("end", () => {
      isDraggingSignal.value = false;
    })

    d3Selection.call(dragListener as any);
  }

  return (
    <svg
      width={width}
      height={height}
      onWheel={e => {
        if (!isDraggingSignal.peek()) return
        rangeSignal.value = (Math.max(1, Math.min(10, rangeSignal.peek() - e.deltaY / 100)))
      }}
    >
      <g className="text-muted-foreground">
        {y.ticks(5).map(tick => (
          <g key={tick}>
            <line
              x1={marginLeft + 32}
              x2={width - marginRight}
              y1={y(tick)}
              y2={y(tick)}
              stroke="currentColor"
              strokeWidth={0.5}
            />
            <text
              x={marginLeft}
              y={y(tick)}
              textAnchor="start"
              dy="0.3em"
              fill="currentColor"
            >
              {tick}X
            </text>
          </g>
        ))}
      </g>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        d={line(field.data.value.map(e => e.data.value)) ?? undefined}
      />
      <g
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {field.data.value.map((d, i) => (<circle
          ref={addOnDragListener}
          key={i}
          cx={x(i)}
          cy={y(d.data.value)}
          r="4"
          className={isFrameIncluded(i + 1) ? "text-primary" : "text-muted-foreground"}
          fill="currentColor"
        />))}
      </g>
    </svg>
  );
}