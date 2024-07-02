"use client";

import {isCreateProjectDrawerOpen} from "@/components/project/project.signals";
import {ImagePlusIcon, PlusIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {isCreateStackDrawerOpen} from "@/components/stack/stack.signal";

export function CreateStackButton() {
  return (
    <Button onClick={() => isCreateStackDrawerOpen.value = true}>
        <PlusIcon className="h-4 w-4 mr-2"/>
        Add Stack
  </Button>
  )
}