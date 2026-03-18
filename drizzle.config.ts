import * as dotenv from "dotenv";
import * as path from "path";
// Load .env.local (Next.js) or .env for drizzle-kit
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
