import type { Cargo } from "./cargos";

export interface PessoaDoNumero {
  id: number;
  nome: string;
  cargo: Cargo;
}

/** Números do mês para o diretor (spec, seção 8; decisões 2 a 4 e 10 do plano da fase 6). Valores em centavos. */
export interface NumerosDoTime {
  mes: string;
  propostas: number;
  ganhas: number;
  perdidas: number;
  /** ganhas ÷ (ganhas + perdidas) decididas no mês; nutrição não conta. null sem decisão. */
  conversao: number | null;
  valorVendido: number;
  tempoMedioDias: number | null;
  pactosPorReuniao: number | null;
  objecoes: { texto: string; empresa: string; closer: string | null; dia: string }[];
  porCloser: { pessoa: PessoaDoNumero; propostas: number; ganhas: number; valorVendido: number }[];
  rotina: { pessoa: PessoaDoNumero; feitos: number; total: number }[];
}
