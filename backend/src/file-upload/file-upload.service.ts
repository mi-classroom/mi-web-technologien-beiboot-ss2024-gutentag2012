import { Injectable } from '@nestjs/common';
import {MinioClientService} from "../minio-client/minio-client.service";

@Injectable()
export class FileUploadService {
  constructor(private readonly minioClientService: MinioClientService) {
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
    return this.minioClientService.listFiles(folder)
  }

  public async upload(file: Express.Multer.File, options: { prefix?: string, newName?: string }) {
    return this.minioClientService.uploadVideo(file, options)
  }

  public async fileExists(filename: string) {
    return this.minioClientService.fileExists(filename)
  }

  public async deleteFolder(folder: string) {
    return this.minioClientService.deleteFolder(folder)
  }
}
