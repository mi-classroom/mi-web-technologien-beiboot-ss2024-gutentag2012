import {Injectable} from "@nestjs/common";
import type {Env} from "./env";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class EnvService {
    constructor(private readonly configService: ConfigService) {
    }

    get<T extends keyof Env>(key: T): Env[T] {
        return this.configService.get(key, {infer: true}) as Env[T];
    }
}
