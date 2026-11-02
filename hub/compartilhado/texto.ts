/** Texto para comparar e buscar: sem acentos, minúsculo, espaços colapsados. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** E-mail como é guardado e comparado: sem espaços nas pontas e minúsculo. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
