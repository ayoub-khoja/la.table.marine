import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.js"],
  },
  resolve: {
    alias: {
      "@library": path.resolve(__dirname, "src/app/_lib"),
      "@components": path.resolve(__dirname, "src/app/_components"),
      "@data": path.resolve(__dirname, "src/data"),
    },
  },
});
