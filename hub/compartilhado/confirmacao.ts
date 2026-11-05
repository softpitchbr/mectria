/**
 * A hora de cada FUP de confirmação no dia da reunião (docs/17, seção 3): o FUP 1 sai ao começar o dia (sem hora fixa),
 * o 2 duas horas antes e o 3 trinta minutos antes. Nunca antes da meia-noite do dia da reunião.
 */
export function horaDoFup(numero: 1 | 2 | 3, horaDaReuniao: string): string | null {
  if (numero === 1) return null;
  const [h, m] = horaDaReuniao.split(":").map(Number);
  const minutos = Math.max(0, h * 60 + m - (numero === 2 ? 120 : 30));
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}
