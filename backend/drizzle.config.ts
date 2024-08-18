export default {
  dialect: "sqlite",
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.DB_URL
  }
}