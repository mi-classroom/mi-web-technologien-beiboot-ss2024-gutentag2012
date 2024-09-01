"use client";

import {
	generateImageForm,
	isGenerateImageDrawerOpen,
} from "@/components/image/image.signal";
import { CreateStackButton } from "@/components/stack/CreateStackButton";
import { DeleteStackDialog } from "@/components/stack/DeleteStackDialog";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Stack } from "@/lib/repos/project.repo";
import { EllipsisVerticalIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";

type StackTableProps = {
	stacks: Stack[];
	className?: string;
};

const generateForStack = (stack: Stack) => () => {
	generateImageForm.handleChange("stack" as never, `${stack.id}` as never);
	isGenerateImageDrawerOpen.value = true;
};

export function StackTable({ stacks, className }: StackTableProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Stacks</CardTitle>
				<CardDescription>Manage your stacks</CardDescription>
			</CardHeader>
			<CardContent>
				<Table className="mb-2">
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead>Stack</TableHead>
							<TableHead>From</TableHead>
							<TableHead>To</TableHead>
							<TableHead>Framerate</TableHead>
							<TableHead>Scale</TableHead>
							<TableHead>Memory Usage</TableHead>
							<TableHead>Results</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<>
							{!stacks.length && (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={8}
										className="text-muted-foreground text-center py-4 text-base"
									>
										No stacks found
									</TableCell>
								</TableRow>
							)}
							{stacks.map((stack) => (
								<DeleteStackDialog stack={stack} key={stack.name}>
									<ContextMenu>
										<ContextMenuTrigger asChild>
											<TableRow onDoubleClick={generateForStack(stack)}>
												<TableCell>{stack.name}</TableCell>
												<TableCell>{stack.from || "-"}</TableCell>
												<TableCell>{stack.to || "-"}</TableCell>
												<TableCell>{stack.frameRate}</TableCell>
												<TableCell>{stack.scale}</TableCell>
												<TableCell>{stack.memoryUsage.toFixed(2)} GB</TableCell>
												<TableCell>{stack.totalResultCount}</TableCell>
												<TableCell align="right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button size="icon" variant="ghost">
																<EllipsisVerticalIcon className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent>
															<DropdownMenuItem
																onClick={generateForStack(stack)}
															>
																<ImagePlusIcon className="h-4 w-4 mr-2" />
																Generate Image
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<AlertDialogTrigger asChild>
																<ContextMenuItem className="group bg-destructive text-destructive-foreground focus:bg-destructive/40">
																	<Trash2Icon className="h-4 w-4 mr-2" />
																	Delete
																</ContextMenuItem>
															</AlertDialogTrigger>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										</ContextMenuTrigger>
										<ContextMenuContent>
											<ContextMenuItem onClick={generateForStack(stack)}>
												<ImagePlusIcon className="h-4 w-4 mr-2" />
												Generate Image
											</ContextMenuItem>
											<ContextMenuSeparator />
											<AlertDialogTrigger asChild>
												<ContextMenuItem className="group bg-destructive text-destructive-foreground focus:bg-destructive/40">
													<Trash2Icon className="h-4 w-4 mr-2" />
													Delete
												</ContextMenuItem>
											</AlertDialogTrigger>
										</ContextMenuContent>
									</ContextMenu>
								</DeleteStackDialog>
							))}
						</>
					</TableBody>
				</Table>
			</CardContent>
			<CardFooter>
				<CreateStackButton />
			</CardFooter>
		</Card>
	);
}
