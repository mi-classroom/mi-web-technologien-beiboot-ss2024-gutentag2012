"use client"

import {Project} from "@/lib/project.repo";
import {
  Drawer, DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import {generateImageForm, isGenerateImageDrawerOpen} from "@/components/image/image.signal";
import {useCallback, useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {useFormWithComponents} from "@formsignals/form-react";
import {Carousel, CarouselApi, CarouselContent, CarouselItem} from "@/components/ui/carousel";
import {useComputed, useSignal, useSignalEffect} from "@preact/signals-react";
import {createImageFromStack, getFilesInStack} from "@/lib/stack.repo";
import Image from "next/image";
import {getImagePath} from "@/lib/utils";
import {SliderForm, SliderSignal} from "@/components/ui/slider";
import {listenToProgress} from "@/lib/progress.repo";
import {progressDialogData, updateProgress} from "@/components/functional/ProgressDialog";
import {FrameBlockers} from "@/components/functional/FrameBlockers";
import {WeightPicker} from "@/components/functional/WeightPicker";
import {Label} from "@/components/ui/label";
import {FrameInputs} from "@/components/functional/FrameInputs";
import {ErrorText} from "@/components/functional/ErrorText";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSignal,
  DialogTitle
} from "@/components/ui/dialog";

type CreateImageFormDrawerProps = {
  projects: Project[]
}

export function GenerateImageFormDialog({projects}: CreateImageFormDrawerProps) {
  const form = useFormWithComponents(generateImageForm)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [availableImages, setAvailableImages] = useState<Array<{ name: string }>>([])

  const focussedImage = useSignal(0)
  useSignalEffect(() => {
    const currentFocus = focussedImage.value
    if (!carouselApi) return
    carouselApi.scrollTo(currentFocus - 2)
  });
  const sliderFocus = useComputed(() => [focussedImage.value])

  useEffect(() => {
    if (!carouselApi) return

    carouselApi.on("select", () => {
      focussedImage.value = carouselApi.selectedScrollSnap() + 2
    })
  }, [carouselApi]);

  const selectedStack = useComputed(() => {
    if (!form.json.value.stack) return null
    return projects.flatMap(p => p.stacks).find(s => s.name === form.json.value.stack)
  })

  useSignalEffect(() => {
    const project = form.data.value.project?.value
    const stack = form.data.value.stack?.value
    if (!project || !stack) return

    getFilesInStack(project, stack).then(setAvailableImages)
  })

  useEffect(() => {
    form.updateOptions({
      defaultValues: {
        project: projects[0].name,
        stack: projects[0].stacks[0].name,
        frames: [1, availableImages.length],
        weights: Array.from({length: availableImages.length}, () => 1)
      },
      onSubmit: async values => {
        progressDialogData.value = {
          CurrentStep: 0,
          MaxSteps: 0,
          Message: "Waiting for server...",
          options: {
            label: "Image Generating",
            description: "Currently processing the given frames to generate a long term exposure image. Be aware that this might take a while depending on the input.",
          }
        }

        await createImageFromStack(values);
        return new Promise(r => {
          const identifier = `${values.project}-${values.stack}-${values.frames.join("-")}`
          listenToProgress("generate-image", identifier, data => {
            updateProgress(data)
            if (data.CurrentStep !== data.MaxSteps) return
            r(undefined)
          })
        })
      }
    })
  }, [availableImages])

  const onSliderChange = useCallback((values: number[]) => {
    const changedPictureIndex = values.find((v, i) => v !== form.json.peek().frames[i])
    form.handleChange("frames" as never, values as never)
    if(changedPictureIndex !== undefined) focussedImage.value = changedPictureIndex
  }, [carouselApi])

  return (<>
    <DialogSignal
      open={isGenerateImageDrawerOpen}
      onOpenChange={newOpen => {
        isGenerateImageDrawerOpen.value = newOpen
        if(!newOpen) generateImageForm.reset()
      }}
    >
      <DialogContent className="absolute max-w-[80vw]">
        <DialogHeader>
          <DialogTitle>Generate new Image</DialogTitle>
          <DialogDescription>Here you can generate a new image from a stack.</DialogDescription>
        </DialogHeader>

        <form.FormProvider>
          <form
            style={{
              width: "calc(80vw - 48px)",
              maxWidth: "calc(80vw - 48px)"
            }}
            onSubmit={e => {
              e.preventDefault()
              void generateImageForm.handleSubmit()
            }}
          >
            {/* TODO Add Preview Slider */}
            {/*<div className="mx-4 my-2">*/}
            {/*  <SliderSignal value={sliderFocus} min={0} max={availableImages.length} onValueChange={v => focussedImage.value = v[0]} />*/}
            {/*</div>*/}

            <Carousel
              setApi={setCarouselApi}
              opts={{dragFree: true}}
              className="mx-4"
              onChange={i => console.log(i)}
              onFocus={e => console.log(e)}
            >
              <CarouselContent>
              {availableImages.map(({name}, i) => (
                <CarouselItem
                  key={name}
                  className="basis-1/1 relative"
                >
                  <div className="relative">
                    <img
                      className="object-cover mx-auto rounded-t max-w-96 w-96"
                      loading="lazy"
                      src={getImagePath(encodeURIComponent(name))}
                      alt={name}
                    />
                    <p className="absolute top-0 left-0 bg-card text-card-foreground rounded-br p-1 text-xs">{i}</p>
                  </div>
                </CarouselItem>
              ))}
                </CarouselContent>
            </Carousel>

            <form.FieldProvider
              name="frames"
              validator={values => {
                if (values.length % 2 !== 0) {
                  return "Frames must be in pairs"
                }
                return values.some((v, i, arr) => i !== 0 && v < arr[i - 1]) && "Frames must be in ascending order"
              }}
              validateOnNestedChange
            >
              <WeightPicker maxWeight={Math.round(availableImages.length / 5)}/>
              <SliderForm
                min={1}
                max={availableImages.length}
                step={1}
                onValueChange={onSliderChange}
              >
                <FrameBlockers max={availableImages.length}/>
              </SliderForm>

              <Label className="mt-4 mb-2 inline-block">Frames to include</Label>
              <div className="flex flex-col gap-2">
                {carouselApi && <FrameInputs
                    focussedImage={focussedImage}
                    max={availableImages.length}
                />}
              </div>
            <ErrorText/>
            </form.FieldProvider>

            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={!form.canSubmit.value}
              >
                Generate Image
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
      </form.FormProvider>
      </DialogContent>
    </DialogSignal>
  </>)
}