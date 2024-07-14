"use client";

import { isGenerateImageDrawerOpen } from "@/components/image/image.signal";
import { isCreateProjectDrawerOpen } from "@/components/project/project.signals";
import { isCreateStackDrawerOpen } from "@/components/stack/stack.signal";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import type { Project } from "@/lib/repos/project.repo";
import {
	ExternalLinkIcon,
	FilePlusIcon,
	ImagePlusIcon,
	PlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CommanderProps = {
	projects: Project[];
};

export function Commander({ projects }: CommanderProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "j" && (e.metaKey || e.altKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}

			for (let i = 0; i < 10; i++) {
				if (!projects[i]) continue;
				if (e.key === (i + 1).toString() && (e.metaKey || e.altKey)) {
					router.push(projects[i].name);
				}
			}
			if (e.key === "0" && (e.metaKey || e.altKey)) {
				router.push("/");
			}

			if (e.key === "g" && (e.metaKey || e.altKey))
				isGenerateImageDrawerOpen.value = true;
			if (e.key === "s" && (e.metaKey || e.altKey))
				isCreateStackDrawerOpen.value = true;
			if (e.key === "p" && (e.metaKey || e.altKey))
				isCreateProjectDrawerOpen.value = true;
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [router, projects]);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Navigation">
					<>
						{projects.map((project, i) => (
							<CommandItem
								key={project.name}
								onSelect={() => {
									router.push(project.name);
									setOpen(false);
								}}
							>
								<ExternalLinkIcon className="mr-2 h-4 w-4" />
								<span>Open: {project.name}</span>
								<>
									{i < 10 && <CommandShortcut>alt + {i + 1}</CommandShortcut>}
								</>
							</CommandItem>
						))}
					</>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Actions">
					<CommandItem
						onSelect={() => {
							isGenerateImageDrawerOpen.value = true;
							setOpen(false);
						}}
					>
						<ImagePlusIcon className="mr-2 h-4 w-4" />
						<span>Generate Image</span>
						<CommandShortcut>alt + G</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							isCreateStackDrawerOpen.value = true;
							setOpen(false);
						}}
					>
						<PlusIcon className="mr-2 h-4 w-4" />
						<span>Add Stack</span>
						<CommandShortcut>alt + S</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => {
							isCreateProjectDrawerOpen.value = true;
							setOpen(false);
						}}
					>
						<FilePlusIcon className="mr-2 h-4 w-4" />
						<span>Create Project</span>
						<CommandShortcut>alt + P</CommandShortcut>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
