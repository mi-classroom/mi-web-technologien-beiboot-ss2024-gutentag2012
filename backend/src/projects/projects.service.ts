import {Injectable} from '@nestjs/common';
import {MinioClientService} from "../minio-client/minio-client.service";
import {getResultImageFromName, getStackFromStackName} from "./projects.utils";
import {onlyFulfilledPromises} from "../promise.utils";

@Injectable()
export class ProjectsService {
  constructor(private readonly minioClientService: MinioClientService) {
  }

  public async getAllProjects() {
    const rootFiles = await this.minioClientService.listFiles("root")

    const projectPromises = rootFiles
      .filter(file => file.prefix)
      .map(async projectFile => {
        const projectName = projectFile.prefix!.replace(/\/$/, "")
        const [stacks, otherFiles] = await this.getStacksForProject(projectName)

        return {
          name: projectName,
          stacks,
          otherFiles,
        }
      })

    return onlyFulfilledPromises(projectPromises)
  }

  public async getStacksForProject(projectName: string) {
    const projectEntries = await this.minioClientService.listFiles(projectName + "/", false)

    const stackPromises = projectEntries
      .filter(projectEntry => projectEntry.prefix)
      .map(projectEntry => getStackFromStackName(projectEntry.prefix!))
      .map(async stack => {
        const results = await this.getStackResultsForStack(projectName, stack.name)
        return {
          ...stack,
          results
        }
      })

    return [await onlyFulfilledPromises(stackPromises), projectEntries.filter(file => !file.prefix).map(file => file.name)] as const
  }

  private async getStackResultsForStack(projectName: string, stackName: string) {
    const stackEntries = await this.minioClientService.listFiles(projectName + "/" + stackName + "/outputs/", false)
    return stackEntries.map(e => getResultImageFromName(e.name!))
  }
}
