"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const env_service_1 = require("./env/env.service");
const services_1 = require("@nestjs/common/services");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const envService = app.get(env_service_1.EnvService);
    await app.listen(envService.get("PORT"));
    services_1.Logger.log(`Server running on port :${envService.get("PORT")}`);
}
bootstrap();
//# sourceMappingURL=main.js.map