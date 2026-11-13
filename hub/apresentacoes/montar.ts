// npm run apresentacoes: monta cada fonte/*.html (menos as que começam com _) em apresentacoes/<nome>.html.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { montarDeck } from "./montagem.ts";

const pasta = dirname(fileURLToPath(import.meta.url));
const ler = (arquivo: string) => readFileSync(join(pasta, "fonte", arquivo), "utf8");
const css = ler("kit.css");
const js = ler("kit.js");
for (const nome of readdirSync(join(pasta, "fonte"))) {
  if (!nome.endsWith(".html") || nome.startsWith("_")) continue;
  const html = montarDeck(ler(nome), css, js);
  writeFileSync(join(pasta, nome), html);
  console.log(`${nome}: ${Math.round(Buffer.byteLength(html) / 1024)} KB`);
}
