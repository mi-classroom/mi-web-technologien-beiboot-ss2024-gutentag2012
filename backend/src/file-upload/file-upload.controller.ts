import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Response, Body, Delete
} from '@nestjs/common';
import {FileUploadService} from "./file-upload.service";
import {FileInterceptor} from "@nestjs/platform-express";
import {Express} from "express";
import {UnsupportedMimeType} from "../minio-client/minio-client.service";

@Controller('file-upload')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
  ) {
  }

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { prefix?: string, newName?: string }
  ) {
    if(!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST)
    }
    return this.fileUploadService.upload(file, body).catch(err => {
      if (err instanceof UnsupportedMimeType) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException(`Error uploading file ${err?.message ?? err}`, HttpStatus.INTERNAL_SERVER_ERROR)
    });
  }

  @Get("/get/:filename")
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const file = await this.fileUploadService.getFile(filename).catch(err => {
      throw new HttpException(`Error getting file "${filename}": ${err?.message ?? err}`, HttpStatus.INTERNAL_SERVER_ERROR)
    });

    if(!file) {
      throw new HttpException(`File "${filename}" not found`, HttpStatus.NOT_FOUND)
    }

    (res as any).set({
      'Content-Disposition': `attachment; filename="${filename}"`,
    })
    file.pipe(res as any)
  }

  @Get("/list/:folder")
  async listFiles(@Param('folder') folder: string) {
    return this.fileUploadService.listFiles(folder)
  }

  @Get("/exists/:filename")
  async fileExists(@Param('filename') filename: string) {
    return this.fileUploadService.fileExists(filename)
  }

  @Delete("/delete/:folder")
  async deleteFolder(@Param('folder') folder: string) {
    return this.fileUploadService.deleteFolder(folder)
  }
}
