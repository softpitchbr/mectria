/** Texto para comparar e buscar: sem acentos, minúsculo, espaços colapsados. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** E-mail como é guardado e comparado: sem caracteres invisíveis, sem espaços nas pontas e minúsculo. */
export function normalizarEmail(email: string): string {
  return email.replace(/[\u200b-\u200d\u2060\ufeff]/g, "").trim().toLowerCase();
}
