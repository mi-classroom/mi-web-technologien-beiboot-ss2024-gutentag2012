import { Injectable } from '@nestjs/common';
import {MinioClientService} from "../minio-client/minio-client.service";

@Injectable()
export class FileUploadService {
  constructor(private readonly minioClientService: MinioClientService) {
  }

  public async getFile(filename: string) {
    return this.minioClientService.getFile(filename)
  }

  public async listFiles() {
    return this.minioClientService.listFiles()
  }

  public async upload(file: Express.Multer.File) {
    return this.minioClientService.uploadVideo(file)
  }
}
