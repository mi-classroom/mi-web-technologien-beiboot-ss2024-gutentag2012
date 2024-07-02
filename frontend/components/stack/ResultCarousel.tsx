import {ResultImage} from "@/lib/project.repo";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel";
import Link from "next/link";
import {getImagePath} from "@/lib/utils";
import Image from "next/image";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import {ExternalLinkIcon, PencilLineIcon} from "lucide-react";
import {DeleteFolderContextMenuItem} from "@/components/project/DeleteFolderContextMenuItem";

type ResultCarouselProps = {
  results: ResultImage[]
}

export function ResultCarousel({results}: ResultCarouselProps) {
  if (!results.length) {
    return <p className="text-muted-foreground text-center mt-4">No results found</p>
  }
  return (
    <Carousel className="mb-2 mx-4">
      <CarouselContent>
        {results.map(result => (
          <CarouselItem
            key={result.project + result.stack + result.name}
            className="basis-1/1 relative"
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <Link
                  href={getImagePath(result.project, result.stack, "outputs", result.name)}
                  target="_blank"
                >
                  <Image
                    className="object-cover mx-auto w-full rounded-t max-h-96 h-96"
                    priority
                    width={660}
                    height={400}
                    src={getImagePath(result.project, result.stack, "outputs", result.name)}
                    alt={result.name}
                  />
                </Link>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <Link href={getImagePath(result.project, result.stack, "outputs", result.name)} target="_blank">
                  <ContextMenuItem>
                      <ExternalLinkIcon className="h-4 w-4 mr-2"/>
                      Open
                  </ContextMenuItem>
                </Link>
                  {/*TODO Open with preselection in generate image dialog*/}
                  <ContextMenuItem>
                      <PencilLineIcon className="h-4 w-4 mr-2"/>
                      Create variant
                  </ContextMenuItem>
                <ContextMenuSeparator/>
                <DeleteFolderContextMenuItem paths={[result.project, result.stack, "outputs", result.name]} />
              </ContextMenuContent>
            </ContextMenu>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious/>
      <CarouselNext/>
    </Carousel>
  )
}