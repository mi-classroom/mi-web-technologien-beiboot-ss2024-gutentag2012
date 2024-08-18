import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";
import * as schema from "./schema";

export const DATABASE = Symbol("DATABASE");

export const databaseProvider = {
	provide: DATABASE,
	useFactory: async (envService: EnvService) => {
		const dbURL = envService.get("DB_URL");
		const client = createClient({ url: dbURL });
		return drizzle(client, { schema, logger: true });
	},
	exports: [DATABASE],
	inject: [EnvService],
	imports: [EnvModule],
};
