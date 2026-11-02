import { env } from "cloudflare:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { emailDaRequisicao } from "./identidade";
import type { Env } from "./tipos";

const EQUIPE = "mectria-teste";
const AUD = "aud-de-teste";
const ISSUER = `https://${EQUIPE}.cloudflareaccess.com`;

let chaves: JWTVerifyGetKey;
let privada: CryptoKey;

beforeAll(async () => {
  const par = await generateKeyPair("RS256");
  privada = par.privateKey;
  const publica = { ...(await exportJWK(par.publicKey)), kid: "k1", alg: "RS256" };
  chaves = createLocalJWKSet({ keys: [publica] });
});

const producao: Env = { ...env, AMBIENTE: "producao", ACCESS_EQUIPE: EQUIPE, ACCESS_AUD: AUD };

function assinar(claims: Record<string, unknown>, audiencia = AUD) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(ISSUER)
    .setAudience(audiencia)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privada);
}

function requisicao(cabecalhos: Record<string, string>, endereco = "https://hub.exemplo.com/api/eu") {
  return new Request(endereco, { headers: cabecalhos });
}

const LOCAL = "http://localhost:8788/api/eu";

test("em produção, JWT válido do Access devolve o e-mail normalizado", async () => {
  const jwt = await assinar({ email: "Ana@MecTRIA.com" });
  const email = await emailDaRequisicao(requisicao({ "Cf-Access-Jwt-Assertion": jwt }), producao, { jwks: chaves });
  expect(email).toBe("ana@mectria.com");
});

test("em produção, JWT com audience errada devolve null", async () => {
  const jwt = await assinar({ email: "ana@mectria.com" }, "outra-aplicacao");
  expect(await emailDaRequisicao(requisicao({ "Cf-Access-Jwt-Assertion": jwt }), producao, { jwks: chaves })).toBeNull();
});

test("em produção, sem JWT ou com JWT sem e-mail devolve null", async () => {
  expect(await emailDaRequisicao(requisicao({}), producao, { jwks: chaves })).toBeNull();
  const jwt = await assinar({ sub: "servico" });
  expect(await emailDaRequisicao(requisicao({ "Cf-Access-Jwt-Assertion": jwt }), producao, { jwks: chaves })).toBeNull();
});

test("em produção, o cabeçalho X-Dev-Email é ignorado", async () => {
  expect(await emailDaRequisicao(requisicao({ "X-Dev-Email": "ana@mectria.com" }), producao, { jwks: chaves })).toBeNull();
});

test("em produção sem equipe ou audience configuradas, ninguém entra", async () => {
  const jwt = await assinar({ email: "ana@mectria.com" });
  const semAud: Env = { ...producao, ACCESS_AUD: undefined };
  expect(await emailDaRequisicao(requisicao({ "Cf-Access-Jwt-Assertion": jwt }), semAud, { jwks: chaves })).toBeNull();
});

test("em dev, X-Dev-Email com espaços e maiúsculas devolve o e-mail normalizado", async () => {
  const dev: Env = { ...env, AMBIENTE: "dev" };
  expect(await emailDaRequisicao(requisicao({ "X-Dev-Email": " Ana@mectria.com " }, LOCAL), dev)).toBe("ana@mectria.com");
  expect(await emailDaRequisicao(requisicao({}, LOCAL), dev)).toBeNull();
});

test("AMBIENTE=dev esquecido num endereço público não aceita o cabeçalho de dev", async () => {
  const dev: Env = { ...env, AMBIENTE: "dev", DEV_EMAIL: "dir@mectria.com" };
  expect(await emailDaRequisicao(requisicao({ "X-Dev-Email": "dir@mectria.com" }), dev)).toBeNull();
  expect(await emailDaRequisicao(requisicao({}), dev)).toBeNull();
});

test("em dev local sem cabeçalho, usa o DEV_EMAIL do .dev.vars", async () => {
  const dev: Env = { ...env, AMBIENTE: "dev", DEV_EMAIL: " Dir@MecTRIA.com " };
  expect(await emailDaRequisicao(requisicao({}, LOCAL), dev)).toBe("dir@mectria.com");
  expect(await emailDaRequisicao(requisicao({ "X-Dev-Email": "hun@mectria.com" }, "http://127.0.0.1:8788/api/eu"), dev)).toBe(
    "hun@mectria.com",
  );
});
