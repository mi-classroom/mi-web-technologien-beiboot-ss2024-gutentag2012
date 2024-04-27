import type { Env } from "./env";
import { ConfigService } from "@nestjs/config";
export declare class EnvService {
    private readonly configService;
    constructor(configService: ConfigService);
    get<T extends keyof Env>(key: T): Env[T];
}
