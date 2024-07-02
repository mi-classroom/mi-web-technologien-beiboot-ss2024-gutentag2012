import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Stack} from "@/lib/project.repo";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {EllipsisVerticalIcon, ExternalLinkIcon, ImagePlusIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {StackDeleteMenuItem} from "@/components/stack/StackDeleteMenuItem";

type StackTableProps = {
  stacks: Stack[];
}

export function StackTable({stacks}: StackTableProps) {
  if (!stacks.length) {
    return <p className="text-muted-foreground text-center mt-4">No stacks found</p>
  }
  return (
    <Table className="mb-2">
          <TableHeader>
            <TableRow>
              <TableHead>Stack</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Framerate</TableHead>
              <TableHead>Scale</TableHead>
              <TableHead>Results</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stacks.map(stack => (
              <TableRow key={stack.name}>
                <TableCell>{stack.name}</TableCell>
                <TableCell>{stack.from || "-"}</TableCell>
                <TableCell>{stack.to || "-"}</TableCell>
                <TableCell>{stack.frameRate}</TableCell>
                <TableCell>{stack.scale}</TableCell>
                <TableCell>{stack.results.length}</TableCell>
                <TableCell align="right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="icon"><EllipsisVerticalIcon className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <ImagePlusIcon className="h-4 w-4 mr-2"/>
                        Generate Image
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <StackDeleteMenuItem stack={stack}/>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
  )
}