import type { Cargo } from "./cargos";
import type { NomeIcone } from "./icones";

export type Secao = "hoje" | "reunioes" | "followup" | "playbooks" | "apresentacoes" | "rotinas" | "time" | "briefings";

/** As seções do hub, na ordem do menu, com a fase em que cada uma fica pronta. */
export const SECOES: { id: Secao; rotulo: string; caminho: string; icone: NomeIcone; fase: number }[] = [
  { id: "hoje", rotulo: "Hoje", caminho: "/", icone: "hoje", fase: 2 },
  { id: "reunioes", rotulo: "Reuniões", caminho: "/reunioes", icone: "reunioes", fase: 3 },
  { id: "followup", rotulo: "Follow-up", caminho: "/follow-up", icone: "followup", fase: 2 },
  { id: "playbooks", rotulo: "Playbooks", caminho: "/playbooks", icone: "playbooks", fase: 3 },
  { id: "apresentacoes", rotulo: "Apresentações", caminho: "/apresentacoes", icone: "apresentacoes", fase: 4 },
  { id: "rotinas", rotulo: "Rotinas", caminho: "/rotinas", icone: "rotinas", fase: 2 },
  { id: "time", rotulo: "Time", caminho: "/time", icone: "time", fase: 1 },
  { id: "briefings", rotulo: "Briefings", caminho: "/briefings", icone: "briefings", fase: 6 },
];

/** Quem vê cada seção (spec, seções 4 e 5). O diretor vê tudo. */
const QUEM_VE: Record<Secao, readonly Cargo[]> = {
  hoje: ["hunter", "closer", "diretor", "projetos"],
  reunioes: ["closer", "diretor"],
  followup: ["closer", "diretor"],
  playbooks: ["hunter", "closer", "diretor"],
  apresentacoes: ["closer", "diretor"],
  rotinas: ["hunter", "closer", "diretor"],
  time: ["diretor"],
  briefings: ["diretor", "projetos"],
};

export function podeVer(cargo: Cargo, secao: Secao): boolean {
  return QUEM_VE[secao].includes(cargo);
}

export function secoesDoCargo(cargo: Cargo): Secao[] {
  return SECOES.filter((s) => podeVer(cargo, s.id)).map((s) => s.id);
}

export function podeGerenciarPessoas(cargo: Cargo): boolean {
  return cargo === "diretor";
}
