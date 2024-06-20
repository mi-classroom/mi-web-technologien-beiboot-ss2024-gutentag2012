import {useCallback, useMemo, useState} from "react";
import {Carousel, type CarouselApi, CarouselContent, CarouselItem} from "@/components/ui/carousel.tsx";
import {SliderForm} from "@/components/ui/slider.tsx";
import {InputSignal} from "@/components/ui/input.tsx";
import {useFieldContext, useForm, useFormContext} from "@formsignals/form-react";
import {Label} from "@/components/ui/label.tsx";
import {Button} from "@/components/ui/button.tsx";
import {batch, effect, useComputed, useSignalEffect} from "@preact/signals-react";
import {ErrorText, ErrorTextForm} from "@/components/ui/ErrorText.tsx";
import {createImageFromStack, listenToProgress} from "@/lib/video-processor.repo.ts";
import {ProgressDialog, useProgressDialog} from "./ProgressDialog";
import {WeightPicker} from "@/components/functional/WeightPicker.tsx";

/**
 * @useSignals
 */
const CarouselImage = ({file, i, onClick}: { file: string; i: number, onClick?: () => void }) => {
  const form = useFormContext<{ frames: number[], weights: number[] }>()

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

  const weight = useComputed(() => form.data.peek().weights.value[i].data.value)

  return (<>
    <img
      className={`border-4 rounded cursor-pointer ${isFrameIncluded(i + 1) ? "border-primary" : "border-none"}`}
      src={`http://localhost:3001/file-upload/get/${file}`}
      alt="thing"
      loading="lazy"
      onClick={onClick}
    />
          <p className={`absolute top-0 left-4 bg-card text-card-foreground text-xs font-bold p-2 border-t-4 border-l-4 rounded ${isFrameIncluded(i + 1) ? "border-primary" : "border-none"}`}>
            {i + 1}
          </p>
          <p className={`absolute top-0 right-0 bg-card text-card-foreground text-xs font-bold p-2 border-t-4 border-r-4 rounded ${isFrameIncluded(i + 1) ? "border-primary" : "border-none"}`}>
            {weight}X
          </p>
    </>)
}

const SubmitButton = () => {
  const form = useFormContext()

  return (
    <Button
      className="mt-4"
      type="submit"
      disabled={!form.canSubmit.value}
    >
      Generate Long-term Exposure
    </Button>
  )
}

export function ImageGeneratorForm({files, existingOutputs, project, stack}: {
  files: string[],
  existingOutputs: string[],
  project: string,
  stack: string
}) {
  const usedVariables = useMemo(() => existingOutputs.map(s => {
    const frames = s.split(".")[0].split("-")
    return {
      frames: frames.map(f => parseInt(f))
    }
  }), [existingOutputs])
  const progressDialogData = useProgressDialog()

  const [api, setApi] = useState<CarouselApi>()
  const form = useForm({
    defaultValues: {
      frames: [1, files.length],
      weights: Array.from({length: files.length}, () => 1)
    },
    onSubmit: async (values) => {
      await createImageFromStack(project, stack, values);
      return new Promise(r => {
        const identifier = `${project.replaceAll("/", encodeURIComponent("/"))}-${stack}-${values.frames.join("-")}`
        listenToProgress("generate-image", identifier, data => {
          progressDialogData.value = data
          if(data.CurrentStep !== data.MaxSteps) return
          r(undefined)
        })
      })
    },
    validator: values => {
      if(values.frames.some(v => v < 1 || v > files.length)) {
        return "Frames must be within the range of the images"
      }
      if(values.frames.some((v, i, arr) => i !== 0 && v < arr[i - 1])) {
        return "Frames must be in ascending order"
      }
      const stackAlreadyUsed = usedVariables.some(({frames}) => values.frames.length === frames.length && values.frames.every((v, i) => v === frames[i]))
      return stackAlreadyUsed && "This image already exists"
    }
  })

  const onSliderChange = useCallback((values: number[]) => {
    const changedPictureIndex = values.find((v, i) => v !== form.json.peek().frames[i])
    form.handleChange("frames", values)

    if (!api) {
      return;
    }

    if (changedPictureIndex === undefined) return
    api.scrollTo(changedPictureIndex - 2)
  }, [api])

  return (<div>
      <ProgressDialog
        label="Image Processing"
        description="Currently processing the given frames to create a long term exposure image. Be aware that this might take a while depending on the input."
        data={progressDialogData}
        onDone={() => {
          window.location.assign(`/project/${project}`)
          progressDialogData.value = null
        }}
      />
      <form.FormProvider>
      <form
        className="w-full"
        onSubmit={e => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.FieldProvider
          name="frames"
          validator={values => {
            if (values.length % 2 !== 0) {
              return "Frames must be in pairs"
            }
            return values.some((v, i, arr) => i !== 0 && v < arr[i - 1]) && "Frames must be in ascending order"
          }}
        >

        <Carousel
          setApi={setApi}
          opts={{dragFree: true}}
        >
          <CarouselContent>
            {files.map((file, i) => (
              <CarouselItem
                key={file}
                className="basis-1/4 relative"
              >
                <CarouselImage
                  file={file}
                  i={i}
                  onClick={() => {
                    const frames = form.json.peek().frames

                    const isIncludedButNotEdge = frames.findIndex((frame, index, arr) => {
                      const isStartOfPair = index % 2 === 0
                      const start = isStartOfPair ? frame : arr[index - 1]
                      const end = isStartOfPair ? arr[index + 1] : frame
                      if(start === undefined || end === undefined) return false
                      return start - 1 < i && i + 1 < end
                    })
                    let isNotIncludedButNotEdge = frames.findIndex((frame, index, arr) => {
                      const isStartOfPair = index % 2 === 0

                      // We only want to check from the start of a pair or for the last element
                      if (isStartOfPair) {
                        const prevEnd = arr[index - 1]
                        // In this case it before the first boundary
                        if (prevEnd === undefined) return i + 2 < frame
                        return prevEnd < i && i + 2 < frame
                      }
                      return false
                    })
                    if (isNotIncludedButNotEdge === -1 && frames[frames.length - 1] < i && i + 2 < files.length) {
                      isNotIncludedButNotEdge = frames.length
                    }

                    const isIncludedEdge = frames.findIndex((frame) => {
                      return i + 1 === frame
                    })
                    const isNotIncludedEdge = frames.findIndex((frame, index) => {
                      const isStartOfPair = index % 2 === 0
                      return isStartOfPair ? i + 2 === frame : i === frame
                    })

                    // Case 1: The frame is included in the selection, but not at the edge, then we split the pair
                    if(isIncludedButNotEdge !== -1) {
                      batch(() => {
                        form.pushValueToArrayAtIndex(`frames`, isIncludedButNotEdge + 1, i)
                        form.pushValueToArrayAtIndex(`frames`, isIncludedButNotEdge + 2, i + 2)
                      })
                      return
                    }

                    // Case 2: The frame is not included in the selection, but not at the edge of one, then we create a new the pair
                    if (isNotIncludedButNotEdge !== -1) {
                      batch(() => {
                        form.pushValueToArrayAtIndex(`frames`, isNotIncludedButNotEdge, i + 1)
                        form.pushValueToArrayAtIndex(`frames`, isNotIncludedButNotEdge + 1, i + 1)
                      })
                      return
                    }

                    // Case 3: The frame is included in the selection, but at the edge, then we shrink the pair
                    if(isIncludedEdge !== -1) {
                      const isStartOfPair = isIncludedEdge % 2 === 0
                      const arrayEntry = form.data.peek().frames.peek()[isIncludedEdge].data
                      const pairEntry = form.data.peek().frames.peek()[isIncludedEdge + (isStartOfPair ? 1 : -1)].data

                      // If the selection is only one frame, we remove the pair
                      if (arrayEntry.peek() !== pairEntry.peek()) {
                        arrayEntry.value += isStartOfPair ? 1 : -1
                        return
                      }

                      batch(() => {
                        form.removeValueFromArray(`frames`, isIncludedEdge)
                        form.removeValueFromArray(`frames`, isIncludedEdge)
                      })
                      return
                    }

                    // Case 4: The frame is not included in the selection, but at the edge, then we grow the pair
                    if(isNotIncludedEdge !== -1) {
                      const isStartOfPair = isNotIncludedEdge % 2 === 0
                      const arrayEntry = form.data.peek().frames.peek()[isNotIncludedEdge].data
                      const pairEntry = form.data.peek().frames.peek()[isNotIncludedEdge + (isStartOfPair ? -2 : 1)]?.data

                      // If the selection is only one frame, we remove the pair
                      if (pairEntry?.peek() - arrayEntry.peek() !== 2) {
                        arrayEntry.value += isStartOfPair ? -1 : 1
                        return
                      }

                      batch(() => {
                        form.removeValueFromArray(`frames`, isNotIncludedEdge)
                        form.removeValueFromArray(`frames`, isNotIncludedEdge)
                      })
                    }
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
      </Carousel>

          <div className="mt-4 relative">
            <SliderForm
              min={1}
              max={files.length}
              step={1}
              onValueChange={onSliderChange}
            >
              <FrameBlockers max={files.length}/>
            </SliderForm>
          </div>

          <WeightPicker maxWeight={Math.round(files.length / 5)} />

          <Label className="mt-4 mb-2 inline-block">Frames to include</Label>
          <div className="flex flex-col gap-2">
            {api && <FrameInputs api={api} max={files.length}/>}
          </div>
          <ErrorText/>
        </form.FieldProvider>

        <SubmitButton/>

        <ErrorTextForm/>
      </form>
        </form.FormProvider>
    </div>
  )
}


/**
 * @useSignals
 */
const FrameBlockers = ({max}: { max: number }) => {
  const field = useFieldContext<number[], "">()

  const blockerPoints = useComputed(() => {
    const data = field.data.value

    return data.reduce((acc, v, i, arr) => {
      if (i === 0 || i >= arr.length - 1 || i % 2 === 0) return acc
      acc.push([
        v.data.value / max * 100,
        arr[i + 1].data.value / max * 100
      ])
      return acc
    }, [] as [number, number][])
  })

  return (
    blockerPoints.value.map(([left, right], i) => (
      <div
        key={i}
        className="absolute bg-[#072132] h-[6px] top-0"
        style={{left: `${left}%`, right: `${100 - right}%`}}
      />
    ))
  )
}

/**
 * @useSignals
 */
const FrameInputs = ({api, max}: { api: CarouselApi, max: number }) => {
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
                      if (!api) return
                      api.scrollTo(frameIndex - 2)
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