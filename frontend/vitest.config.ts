import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  return {
    test: {
      globals: true,
      environment: "node",
      include: ["src/tests/**/*.test.ts"],
      env: {
        DATABASE_URL: env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy_test",
        JWT_SECRET: env.JWT_SECRET || "dummy_jwt_secret_for_unit_tests_only",
        CRON_SECRET: env.CRON_SECRET || "dummy_cron_secret",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
