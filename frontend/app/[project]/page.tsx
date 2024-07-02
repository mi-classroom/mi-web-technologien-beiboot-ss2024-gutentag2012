import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import {getAllProjects} from "@/lib/project.repo";
import {GenerateImageButton} from "@/components/stack/GenerateImageButton";
import {CreateStackButton} from "@/components/stack/CreateStackButton";
import {StackTable} from "@/components/stack/StackTable";
import {ResultCarousel} from "@/components/stack/ResultCarousel";
import {ProjectsDropdown} from "@/components/project/ProjectsDropdown";
import {getProjectFile} from "@/lib/utils";

export default async function Project({params}: { params: { project: string } }) {
  const projects = await getAllProjects()
  const currentProject = projects.find(project => project.name === params.project)

  if (!currentProject) {
    return <h1>Project not found</h1>
  }

  const videoFile = getProjectFile(currentProject)
  const allResults = currentProject.stacks.flatMap(stack => stack.results)

  return (
    <main className="container overflow-y-auto py-2">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator/>

          <BreadcrumbPage>
            <ProjectsDropdown selection={params.project} />
          </BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

        <div className="w-full flex justify-center">
          {videoFile && <video
              id="project-video"
              className="h-[500px]"
              src={`http://localhost:3001/file-upload/get/${encodeURIComponent(videoFile)}`}
              controls
              preload="auto"
          />}
        </div>

        <h4 className="mt-4 text-lg font-semibold mb-2">All Results</h4>
        <ResultCarousel results={allResults}/>

      <GenerateImageButton/>

        <h4 className="mt-4 text-lg font-semibold mb-2">Stacks</h4>
      <StackTable stacks={currentProject.stacks}/>

      <CreateStackButton/>
    </main>
  )
}