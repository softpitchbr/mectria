import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { normalizarEmail } from "../compartilhado/texto";
import type { Env } from "./tipos";

const chavesPorEmissor = new Map<string, JWTVerifyGetKey>();

function chavesDoAccess(emissor: string): JWTVerifyGetKey {
  let chaves = chavesPorEmissor.get(emissor);
  if (!chaves) {
    chaves = createRemoteJWKSet(new URL(`${emissor}/cdn-cgi/access/certs`));
    chavesPorEmissor.set(emissor, chaves);
  }
  return chaves;
}

const ENDERECOS_LOCAIS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * E-mail de quem fez a requisição, já normalizado, ou null.
 * Em produção vem só do JWT do Cloudflare Access. Em dev, vem do cabeçalho X-Dev-Email
 * ou do DEV_EMAIL do .dev.vars, e só para endereços locais: se AMBIENTE=dev for esquecido
 * num endereço público, ninguém entra.
 */
export async function emailDaRequisicao(
  req: Request,
  env: Env,
  opcoes: { jwks?: JWTVerifyGetKey } = {},
): Promise<string | null> {
  if (env.AMBIENTE === "dev") {
    if (!ENDERECOS_LOCAIS.has(new URL(req.url).hostname)) return null;
    const email = req.headers.get("X-Dev-Email") || env.DEV_EMAIL;
    return email?.trim() ? normalizarEmail(email) : null;
  }

  const token = req.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_EQUIPE || !env.ACCESS_AUD) return null;

  const emissor = `https://${env.ACCESS_EQUIPE}.cloudflareaccess.com`;
  try {
    const { payload } = await jwtVerify(token, opcoes.jwks ?? chavesDoAccess(emissor), {
      issuer: emissor,
      audience: env.ACCESS_AUD,
      algorithms: ["RS256"],
      requiredClaims: ["email"],
    });
    return typeof payload.email === "string" && payload.email.trim() ? normalizarEmail(payload.email) : null;
  } catch {
    return null;
  }
}
