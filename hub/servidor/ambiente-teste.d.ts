// Tipos dos bindings que vitest.api.config.ts entrega aos testes da API.
declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    AMBIENTE: string;
    TEST_MIGRATIONS: D1Migration[];
  }
}
