import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Testes da interface e de compartilhado/, em jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "compartilhado/**/*.test.ts"],
    setupFiles: ["src/teste/preparar.ts"],
    // O CSS do kit das apresentações entra cru nos testes (a montagem é comparada com o arquivo do repositório).
    css: { include: [/apresentacoes\/fonte\/.*\.css/], modules: { classNameStrategy: "non-scoped" } },
  },
});
