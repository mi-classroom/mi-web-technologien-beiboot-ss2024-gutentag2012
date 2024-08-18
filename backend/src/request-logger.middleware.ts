import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
	private readonly logger = new Logger("HTTP");

	use(req: Request, res: Response, next: NextFunction) {
		const start = Date.now();
		const { method, originalUrl } = req;
		res.on("finish", () => {
			const { statusCode } = res;
			const message = `${method} ${originalUrl} ${statusCode} - ${Date.now() - start}ms`;
			if (statusCode >= 500) {
				this.logger.error(message);
			} else if (statusCode >= 400) {
				this.logger.warn(message);
			} else {
				this.logger.log(message);
			}
		});
		try {
			next();
		} catch (error: any) {
			this.logger.error(error.message, error.stack);
			throw error;
		}
	}
}
