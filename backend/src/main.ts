import "reflect-metadata";
import { Logger } from "@nestjs/common/services";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EnvService } from "./env/env.service";
import { RequestLoggerMiddleware } from "./request-logger.middleware";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const envService = app.get(EnvService);

	app.enableCors();

	const middleware = new RequestLoggerMiddleware();
	app.use(middleware.use.bind(middleware));

	await app.listen(envService.get("PORT"));
	Logger.log(`Server running on port :${envService.get("PORT")}`);
}
bootstrap();
