import {useCallback, useMemo, useState} from "react";
import {Carousel, type CarouselApi, CarouselContent, CarouselItem} from "@/components/ui/carousel.tsx";
import {SliderForm} from "@/components/ui/slider.tsx";
import {InputSignal} from "@/components/ui/input.tsx";
import {useFieldContext, useForm, useFormContext} from "@formsignals/form-react";
import {Label} from "@/components/ui/label.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useComputed} from "@preact/signals-react";
import {ErrorText, ErrorTextForm} from "@/components/ui/ErrorText.tsx";
import {createImageFromStack, listenToProgress} from "@/lib/video-processor.repo.ts";
import { ProgressDialog, useProgressDialog } from "./ProgressDialog";

/**
 * @useSignals
 */
const CarouselImage = ({file, i}: { file: string; i: number }) => {
  const form = useFormContext<{ frames: number[] }>()

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

  return (<>
    <img
      className={`border-4 rounded ${isFrameIncluded(i + 1) ? "border-primary" : "border-none"}`}
      src={`http://localhost:3001/file-upload/get/${file}`}
      alt="thing"
      loading="lazy"
    />
            <p className={`absolute top-0 left-4 bg-card text-card-foreground text-xs font-bold p-2 border-t-4 border-l-4 rounded ${isFrameIncluded(i + 1) ? "border-primary" : "border-none"}`}>
              {i + 1}
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

export function ImageGeneratorForm({files, existingOutputs, project, stack}: { files: string[], existingOutputs: string[], project: string, stack: string }) {
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
      frames: [1, files.length]
    },
    onSubmit: async (values) => {
      await createImageFromStack(project, stack, values);
      return new Promise(r => {
        const identifier = `${project.replaceAll("/", encodeURIComponent("/"))}-${stack}-${values.frames.join("-")}`
        listenToProgress("generate-image", identifier, data => {
          progressDialogData.value = data
          if(data.CurrentStep === data.MaxSteps) {
            window.location.assign(`/project/${project}`)
            progressDialogData.value = null
            r(undefined)
          }
        })
      })
    },
    validator: values => {
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

  return (<form
      className="w-full"
      onSubmit={e => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <ProgressDialog label="Image Processing" description="Currently processing the given frames to create a long term exposure image. Be aware that this might take a while depending on the input." data={progressDialogData} />
      
      <form.FormProvider>
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
          <Label className="mt-4 mb-2 inline-block">Frames to include</Label>
          <div className="flex flex-col gap-2">
            {api && <FrameInputs api={api}/>}
          </div>
          <ErrorText/>
        </form.FieldProvider>

        <SubmitButton/>

        <ErrorTextForm/>
        </form.FormProvider>
      </form>
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
const FrameInputs = ({api}: { api: CarouselApi }) => {
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
                  {
                    i !== frames.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentValue = frame.data.peek()
                          const middle = Math.max(currentValue + 1, Math.floor((frames[i + 1].data.peek() - currentValue) / 2) + currentValue)
                          field.pushValueToArrayAtIndex(i + 1, middle)
                        }}
                      >
                    +
                  </Button>
                    )
                  }
                  {
                    i !== frames.length - 1 && i !== 0 && (
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