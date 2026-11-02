import type { Cargo } from "./cargos";

/** Uma pessoa do time comercial, como a API devolve. */
export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  cargo: Cargo;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
