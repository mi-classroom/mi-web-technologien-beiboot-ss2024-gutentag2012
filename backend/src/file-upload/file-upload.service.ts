import { Injectable } from '@nestjs/common';
import {MinioClientService} from "../minio-client/minio-client.service";
import {AmqpClientService} from "../amqp-client/amqp-client.service";

@Injectable()
export class FileUploadService {
  constructor(private readonly minioClientService: MinioClientService, private readonly amqpClientService: AmqpClientService) {
  }

  public async getFile(filename: string) {
    return this.minioClientService.getFile(filename)
  }

  public async getFileStats(filename: string) {
    return this.minioClientService.getFileStats(filename)
  }

  public async getPartialFile(filename: string, start:number, end:number) {
    return this.minioClientService.getPartialFile(filename, start, end)
  }

  public async listFiles(folder: string) {
    return this.minioClientService.listFiles(folder, true)
  }

  public async upload(file: Express.Multer.File, options: { prefix?: string, newName?: string }) {
    return this.minioClientService.uploadVideo(file, options).then(async (res) => {
      const [project, file] = res.filename.split('/')
      await this.amqpClientService.sendGenerateThumbnailRequest(project, file)
      return res
    })
  }

  public async fileExists(filename: string) {
    return this.minioClientService.fileExists(filename)
  }

  public async deleteFolder(folder: string) {
    return this.minioClientService.deleteFolder(folder)
  }
}
