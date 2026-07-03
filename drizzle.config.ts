import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./infrastructure/supabase/schema/index.ts",
  out: "./infrastructure/supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
