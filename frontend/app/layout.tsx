import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Commander } from "@/components/functional/Commander";
import { ProgressDialog } from "@/components/functional/ProgressDialog";
import { GenerateImageFormDialog } from "@/components/image/GenerateImageFormDialog";
import { CreateProjectFormDialog } from "@/components/project/CreateProjectFormDialog";
import { CreateStackFormDialog } from "@/components/stack/CreateStackFormDialog";
import { getAllProjects } from "@/lib/repos/project.repo";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "BLIM - Blend your Images",
	description: "Create beautiful blends of your images with BLIM.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const projects = await getAllProjects();

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					"min-h-screen font-sans antialiased bg-muted/40 text-foreground",
					inter.variable,
				)}
			>
				<header className="bg-card w-full h-16 flex flex-row items-center px-4">
					<h1 className="font-bold text-2xl">BLIM</h1>
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
					<GenerateImageFormDialog projects={projects} />
					<ProgressDialog />
				</ThemeProvider>
			</body>
		</html>
	);
}
