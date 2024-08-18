import {
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Req,
	Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { lookup } from "mime-types";
import { FileUploadService } from "./file-upload.service";

@Controller("file-upload")
export class FileUploadController {
	constructor(private readonly fileUploadService: FileUploadService) {}

	private async sendWholeFile(filename: string, res: Response) {
		const file = await this.fileUploadService.getFile(filename).catch((err) => {
			throw new HttpException(
				`Error getting file "${filename}": ${err?.message ?? err}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		});

		if (!file) {
			throw new HttpException(
				`File "${filename}" not found`,
				HttpStatus.NOT_FOUND,
			);
		}

		res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
		res.setHeader(
			"Content-Type",
			lookup(filename) || "application/octet-stream",
		);

		file.pipe(res);
	}

	private async sendPartialFile(
		filename: string,
		range: string,
		res: Response,
	) {
		const fileStats = await this.fileUploadService.getFileStats(filename);

		const CHUNK_SIZE = 10 ** 6; // 1MB chunk size
		const start = Number(range.replace(/\D/g, ""));
		const end = Math.min(start + CHUNK_SIZE, fileStats.size - 1);

		res.setHeader("Content-Range", `bytes ${start}-${end}/${fileStats.size}`);
		res.setHeader("Accept-Ranges", "bytes");
		res.setHeader("Content-Length", end - start + 1);
		res.setHeader("Content-Type", lookup(filename) || "video/mp4");

		const stream = await this.fileUploadService.getPartialFile(
			filename,
			start,
			end,
		);
		res.status(206);

		stream.pipe(res);
	}

	@Get("/get/:filename")
	async getFile(
		@Param("filename") filename: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const range = req.headers?.range;
		if (!range) {
			await this.sendWholeFile(filename, res);
		} else {
			await this.sendPartialFile(filename, range, res);
		}
	}
}
