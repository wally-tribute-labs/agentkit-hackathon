import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "xmtp/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "json", "html"], include: ["src/core/**/*.ts", "xmtp/handlers.ts"] },
  },
});
