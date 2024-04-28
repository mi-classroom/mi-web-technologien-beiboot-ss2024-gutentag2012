import {Injectable, Logger, HttpException, HttpStatus} from '@nestjs/common';
import {MinioService} from 'nestjs-minio-client';
import {randomUUID} from 'node:crypto'
import {extname} from "node:path"
import {EnvService} from "../env/env.service";

type BucketItem = { name?: string; lastModified?: Date; size: number; }

@Injectable()
export class MinioClientService {
  private readonly minioEndpoint: string;
  private readonly minioPort: number;
  private readonly minioBucket: string;

  private readonly supportedMimeTypes = [
    'video/mp4',
    'video/*',
    '*/*',
  ]

  constructor(
    private readonly minio: MinioService,
    private readonly envService: EnvService
  ) {
    this.minioEndpoint = this.envService.get('MINIO_ENDPOINT');
    this.minioPort = this.envService.get('MINIO_PORT');
    this.minioBucket = this.envService.get('MINIO_BUCKET_NAME');
  }

  public async getFile(filename: string) {
    return this.minio.client.getObject(this.minioBucket, filename)
  }

  public async listFiles() {
    const bucketStream = this.minio.client.listObjects(this.minioBucket)
    return new Promise<BucketItem[]>((resolve, reject) => {
      const data: BucketItem[] = []
      bucketStream.on('data', (obj) => {
        data.push({
          name: obj.name,
          lastModified: obj.lastModified,
          size: obj.size,
        })
      })
      bucketStream.on('error', (err) => {
        reject(err)
      })
      bucketStream.on('end', () => {
        resolve(data)
      })
    })
  }

  public async uploadVideo(file: Express.Multer.File) {
    if (!this.isMimeTypeSupported(file.mimetype)) {
      throw new UnsupportedMimeType(`Unsupported mime type ${file.mimetype}`)
    }

    const fileId = randomUUID();
    const fileExtension = extname(file.originalname);
    const metaData = {
      'Content-Type': file.mimetype,
    };

    const filename = `${fileId}-${Date.now()}${fileExtension}`;
    await this.minio.client.putObject(this.minioBucket, filename, file.buffer, file.size, metaData)

    return {
      filename,
      url: this.getFileUrl(filename, this.minioBucket)
    }
  }

  private isMimeTypeSupported(mimetype: string): boolean {
    return this.supportedMimeTypes.includes(mimetype)
  }

  private getFileUrl(filename: string, bucket: string): string {
    return `${this.minioEndpoint}:${this.minioPort}/${bucket}/${filename}`
  }
}

export class UnsupportedMimeType extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedMimeType';
  }
}