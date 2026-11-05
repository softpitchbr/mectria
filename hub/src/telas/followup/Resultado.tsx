import { useState, type FormEvent } from "react";
import { MOTIVOS_PERDA } from "../../../compartilhado/dados/cadencia";
import { hojeEmSaoPaulo, lerReais } from "../../../compartilhado/datas";
import type { ItemFollowup } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import { mensagemDe } from "./comum";
import { mesesParaRetomar } from "./meses";
import estilos from "./followup.module.css";

type Escolha = "ganha" | "perdida" | "nutricao";
const ROTULOS: Record<Escolha, string> = { ganha: "Ganha", perdida: "Perdida", nutricao: "Nutrição" };

/** Encerra a proposta: ganha (com valor), perdida (com motivo) ou nutrição. */
export default function Resultado({ item, aoRegistrar }: { item: ItemFollowup; aoRegistrar: () => void }) {
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [retomarEm, setRetomarEm] = useState("");
  const [meses] = useState(() => mesesParaRetomar(hojeEmSaoPaulo()));
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function registrar(e: FormEvent) {
    e.preventDefault();
    if (!escolha) return setErro("Escolha o resultado.");
    if (escolha === "ganha" && !(lerReais(valor) ?? 0)) return setErro("Informe o valor fechado.");
    if (escolha === "perdida" && !motivo) return setErro("Escolha o motivo.");
    setErro("");
    setEnviando(true);
    const corpo =
      escolha === "ganha"
        ? { resultado: "ganha", valor }
        : escolha === "perdida"
          ? { resultado: "perdida", motivo }
          : { resultado: "nutricao", ...(retomarEm ? { retomarEm } : {}) };
    try {
      await api(`/api/oportunidades/${item.oportunidade.id}/resultado`, { method: "POST", body: JSON.stringify(corpo) });
      avisar(`${item.oportunidade.empresa}: ${ROTULOS[escolha].toLowerCase()}.`);
      aoRegistrar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form aria-label="Resultado da proposta" className={estilos.resultado} onSubmit={registrar} noValidate>
      <h2>Como terminou?</h2>
      <fieldset className={estilos.opcoes}>
        <legend className="suave">Resultado</legend>
        {(Object.keys(ROTULOS) as Escolha[]).map((r) => (
          <label key={r} className={escolha === r ? estilos.opcaoMarcada : estilos.opcao}>
            <input type="radio" name="resultado" value={r} checked={escolha === r} onChange={() => setEscolha(r)} />
            {ROTULOS[r]}
          </label>
        ))}
      </fieldset>
      {escolha === "ganha" && (
        <Campo rotulo="Valor fechado" inputMode="decimal" placeholder="12.500,00" value={valor} onChange={(e) => setValor(e.target.value)} />
      )}
      {escolha === "perdida" && (
        <Selecao
          rotulo="Motivo"
          vazio="Escolha o motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          opcoes={MOTIVOS_PERDA.map((m) => ({ valor: m, rotulo: m }))}
        />
      )}
      {escolha === "nutricao" && (
        <>
          <Selecao
            rotulo="Retomar em"
            vazio="Em 45 dias (o cliente não deu prazo)"
            value={retomarEm}
            onChange={(e) => setRetomarEm(e.target.value)}
            opcoes={meses}
          />
          <p className="suave">A oportunidade sai do follow-up e volta na aba Reativação no mês escolhido.</p>
        </>
      )}
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Registrar resultado
      </Botao>
    </form>
  );
}
