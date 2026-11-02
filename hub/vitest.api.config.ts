import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

// Testes do servidor e das Functions, dentro do runtime da Cloudflare com D1 local.
export default defineWorkersConfig(async () => {
  const migracoes = await readD1Migrations("migrations");
  return {
    test: {
      include: ["servidor/**/*.test.ts", "functions/**/*.test.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          miniflare: {
            compatibilityDate: "2025-09-01",
            d1Databases: ["DB"],
            bindings: { AMBIENTE: "dev", TEST_MIGRATIONS: migracoes },
          },
        },
      },
    },
  };
});
