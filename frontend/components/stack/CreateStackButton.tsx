"use client";
import { isCreateStackDrawerOpen } from "@/components/stack/stack.signal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export function CreateStackButton() {
	return (
		<Button
			onClick={() => {
				isCreateStackDrawerOpen.value = true;
			}}
		>
			<PlusIcon className="h-4 w-4 mr-2" />
			Add Stack
		</Button>
	);
}
