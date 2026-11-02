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

/**
 * E-mail de quem fez a requisição, já normalizado, ou null.
 * Em produção vem só do JWT do Cloudflare Access; o cabeçalho X-Dev-Email vale só em dev.
 */
export async function emailDaRequisicao(
  req: Request,
  env: Env,
  opcoes: { jwks?: JWTVerifyGetKey } = {},
): Promise<string | null> {
  if (env.AMBIENTE === "dev") {
    const email = req.headers.get("X-Dev-Email");
    return email?.trim() ? normalizarEmail(email) : null;
  }

  const token = req.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_EQUIPE || !env.ACCESS_AUD) return null;

  const emissor = `https://${env.ACCESS_EQUIPE}.cloudflareaccess.com`;
  try {
    const { payload } = await jwtVerify(token, opcoes.jwks ?? chavesDoAccess(emissor), {
      issuer: emissor,
      audience: env.ACCESS_AUD,
    });
    return typeof payload.email === "string" && payload.email.trim() ? normalizarEmail(payload.email) : null;
  } catch {
    return null;
  }
}
