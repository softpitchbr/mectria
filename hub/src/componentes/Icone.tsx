import type { NomeIcone } from "../../compartilhado/icones";

const circulo = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const TRACOS: Record<NomeIcone, string[]> = {
  hoje: ["M6 5h12a2.5 2.5 0 0 1 2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V7.5A2.5 2.5 0 0 1 6 5Z", "M3.5 10h17M8 3v4M16 3v4", "M11.5 15h1"],
  reunioes: [
    "M4 5h10.5A1.5 1.5 0 0 1 16 6.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 4 5Z",
    "M19 9h1a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-1V20l-3-2.5h-3.5",
  ],
  followup: ["M20 12a8 8 0 1 1-2.34-5.66", "M20 4v4.5h-4.5", "M12 8v4.5l3 1.5"],
  playbooks: ["M5 19.5V5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12", "M9 7.5h6"],
  apresentacoes: ["M3 4h18", "M4.5 4v10a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V4", "M12 15.5V19M8.5 21l3.5-2 3.5 2", "M8.5 11.5 11 9l2 2 3-3"],
  rotinas: ["M10 6h10M10 12h10M10 18h10", "M3.5 6 5 7.5 7.5 5M3.5 12 5 13.5 7.5 11M3.5 18 5 19.5 7.5 17"],
  time: [circulo(9, 8, 3.5), "M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5", "M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.8 2.7 2.6 3 5.2"],
  briefings: [
    "M8 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 4H16",
    "M9 2.5h6a1 1 0 0 1 1 1V5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z",
    "M8.5 11h7M8.5 15h5",
  ],
  busca: [circulo(11, 11, 6.5), "M16 16l4.5 4.5"],
  sair: ["M10 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H10", "M15 8l4 4-4 4M19 12H9.5"],
  mais: [circulo(5, 12, 1), circulo(12, 12, 1), circulo(19, 12, 1)],
  fechar: ["M6 6l12 12M18 6 6 18"],
};

type Props = {
  nome: NomeIcone;
  tamanho?: number;
  className?: string;
};

export default function Icone({ nome, tamanho = 20, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {TRACOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
