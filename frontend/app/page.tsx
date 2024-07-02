import {
  Breadcrumb,
  BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {ProjectList} from "@/components/project/ProjectList";

export default function Project() {
  return (
    <main className="container py-2">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbPage>Projects</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <ProjectList />
    </main>
  );
}
