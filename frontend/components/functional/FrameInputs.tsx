import {Button} from "@/components/ui/button";
import {useFieldContext} from "@formsignals/form-react";
import {CarouselApi} from "@/components/ui/carousel";
import {InputSignal} from "@/components/ui/input";
import {Signal} from "@preact/signals-react";

/**
 * @useSignals
 */
export const FrameInputs = ({focussedImage, max}: { focussedImage: Signal<number>, max: number }) => {
  const field = useFieldContext<number[], "">()
  const frames = field.data.value;

  return (
    frames.map((frame, i) => (
      <field.SubFieldProvider
        key={frame.key}
        name={`${i}`}
        transformToBinding={v => v?.toString()}
        transformFromBinding={(v: string) => parseInt(v)}
      >
            {
              subField =>
                <div
                  className="flex flex-row gap-1"
                >
                  <InputSignal
                    type="number"
                    placeholder="Frame number here..."
                    value={subField.transformedData}
                    onChange={e => {
                      const frameIndex = e.target.valueAsNumber
                      if (isNaN(frameIndex)) return
                      subField.handleChange(frameIndex)
                      focussedImage.value = frameIndex
                    }}
                  />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentValue = frame.data.peek()
                          if(frames[i + 1] === undefined) {
                            field.pushValueToArrayAtIndex(i + 1, Math.min(currentValue + 1, max))
                            return
                          }
                          const middle = Math.max(currentValue + 1, Math.floor((frames[i + 1].data.peek() - currentValue) / 2) + currentValue)
                          field.pushValueToArrayAtIndex(i + 1, middle)
                        }}
                      >
                    +
                  </Button>
                  {
                    i !== 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          subField.removeSelfFromArray()
                        }}
                      >
                    -
                  </Button>
                    )
                  }
                </div>
            }
        </field.SubFieldProvider>
    ))
  )
}