"use client";

import {isCreateProjectDrawerOpen} from "@/components/project/project.signals";
import {ImagePlusIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {isGenerateImageDrawerOpen} from "@/components/image/image.signal";

export function GenerateImageButton() {
  return (
    <Button onClick={() => isGenerateImageDrawerOpen.value = true}>
    <ImagePlusIcon className="h-4 w-4 mr-2"/>
      Generate Image
  </Button>
  )
}