export type Cargo = "hunter" | "closer" | "diretor" | "projetos";

export const CARGOS: Cargo[] = ["hunter", "closer", "diretor", "projetos"];

export const ROTULO_CARGO: Record<Cargo, string> = {
  hunter: "Hunter",
  closer: "Closer",
  diretor: "Diretor comercial",
  projetos: "Projetos",
};
