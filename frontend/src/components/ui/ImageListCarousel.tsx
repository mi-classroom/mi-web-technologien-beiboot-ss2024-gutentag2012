import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel.tsx";
import {Button} from "@/components/ui/button.tsx";
import {deleteFolder} from "@/lib/file-upload.repo.ts";

type ImageListCarouselProps = {
  images: string[]
}

export function ImageListCarousel({images}: ImageListCarouselProps) {
  return (
    <Carousel>
      <CarouselContent>
        {images.map((file) => (
          <CarouselItem
            key={file}
            className="basis-1/2 relative"
          >
            <img
              className={`border-4 rounded`}
              src={`http://localhost:3001/file-upload/get/${file}`}
              alt="thing"
              loading="lazy"
            />
            <Button type="button" variant="destructive" className="absolute top-4 right-4" onClick={() => deleteFolder(file).then(() => window.location.reload())}>Delete</Button>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious/>
      <CarouselNext/>
  </Carousel>
  )
}