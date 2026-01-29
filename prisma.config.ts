import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // This fallback solves the 'string | undefined' error from earlier
    url: process.env["DATABASE_URL"] || "",
  },
});