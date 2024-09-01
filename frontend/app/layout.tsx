import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Commander } from "@/components/functional/Commander";
import { GenerateImageFormDialog } from "@/components/image/GenerateImageFormDialog";
import { CreateProjectFormDialog } from "@/components/project/CreateProjectFormDialog";
import { CreateStackFormDialog } from "@/components/stack/CreateStackFormDialog";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMemoryUsage } from "@/lib/repos/jobs.repo";
import { getAllProjects } from "@/lib/repos/project.repo";
import { getAvailableStacks } from "@/lib/repos/stack.repo";
import { InfoCircledIcon } from "@radix-ui/react-icons";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "BLIM - Blend your Images",
	description: "Create beautiful blends of your images with BLIM.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const projects = await getAllProjects();
	const allStacks = await getAvailableStacks();
	const memoryUsage = await getMemoryUsage();

	const memoryUsagePercent =
		(memoryUsage.totalUsage / memoryUsage.maxUsage) * 100;
	const [progressIndicator, progressBackground] =
		memoryUsagePercent <= 70
			? ["bg-primary", "pg-primary/40"]
			: memoryUsagePercent >= 90
				? ["bg-destructive", "bg-destructive/40"]
				: ["bg-orange-700", "bg-orange-700/40"];

	return (
		<html lang="en" suppressHydrationWarning>
			<TooltipProvider>
				<body
					className={cn(
						"min-h-screen font-sans antialiased bg-muted/40 text-foreground",
						inter.variable,
					)}
				>
					<header className="bg-card w-full h-16 flex flex-row items-center justify-between px-4">
						<h1 className="font-bold text-2xl">BLIM</h1>
						<div className="flex flex-col items-end gap-1">
							<Progress
								classNameIndicator={progressIndicator}
								className={`w-64 ${progressBackground}`}
								value={memoryUsagePercent}
							/>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="text-xs text-nowrap flex flex-row gap-1">
										<span className="font-bold">Current memory usage:</span>
										<span>
											{memoryUsage.totalUsage.toFixed(2)} /{" "}
											{memoryUsage.maxUsage.toFixed(2)} GB
										</span>
										<InfoCircledIcon />
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-52 bg-foreground text-background">
									The memory limit is a soft limit and will allow go over it,
									but once it is reached, no new projects, stacks or images can
									be created.
								</TooltipContent>
							</Tooltip>
						</div>
					</header>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						{children}

						<Commander projects={projects} />
						<CreateProjectFormDialog />
						<CreateStackFormDialog projects={projects} />
						<GenerateImageFormDialog allStacks={allStacks} />
					</ThemeProvider>
				</body>
			</TooltipProvider>
		</html>
	);
}
