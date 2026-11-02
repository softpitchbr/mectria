// Tipos dos bindings que vitest.api.config.ts entrega aos testes da API.
import type { Env } from "./tipos";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}
