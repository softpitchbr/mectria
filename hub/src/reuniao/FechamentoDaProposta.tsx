import { useState, type FormEvent } from "react";
import { formatarReais, hojeEmSaoPaulo, lerReais } from "../../compartilhado/datas";
import { MOTIVOS_PERDA } from "../../compartilhado/dados/cadencia";
import { PLAYBOOK_PROPOSTA } from "../../compartilhado/dados/playbooks";
import type { Reuniao } from "../../compartilhado/oportunidade";
import type { DesfechoProposta, FechamentoProposta } from "../../compartilhado/proposta";
import { api } from "../api/cliente";
import Botao from "../componentes/Botao";
import Campo from "../componentes/Campo";
import Selecao from "../componentes/Selecao";
import { mensagemDe } from "../telas/followup/comum";
import estilos from "./Painel.module.css";

/** Os quatro resultados do playbook: o id de cada um é o desfecho gravado. */
const RESULTADOS = PLAYBOOK_PROPOSTA.resultados.map((r) => ({
  id: r.id as DesfechoProposta,
  rotulo: r.rotulo,
}));

/**
 * Fechamento obrigatório da proposta (spec, seção 6): a reunião só termina com o próximo passo registrado.
 * "Vai decidir" e "Pediu ajuste" criam a proposta e os toques de follow-up.
 */
export default function FechamentoDaProposta({
  reuniaoId,
  valorInicial,
  quemDecideInicial,
  antesDeEncerrar,
  aoEncerrar,
  aoVoltar,
}: {
  reuniaoId: number;
  valorInicial: number | null;
  quemDecideInicial: string;
  antesDeEncerrar: () => Promise<boolean>;
  aoEncerrar: (desfecho: DesfechoProposta, resposta: { reuniao: Reuniao; propostaId: number }) => void;
  aoVoltar: () => void;
}) {
  const hoje = hojeEmSaoPaulo();
  const [desfecho, setDesfecho] = useState<DesfechoProposta | null>(null);
  const [c, setC] = useState({
    valor: valorInicial ? formatarReais(valorInicial) : "",
    // O valor fechado começa igual ao apresentado; o desconto à vista muda.
    fechado: valorInicial ? formatarReais(valorInicial) : "",
    data: "",
    quemDecide: quemDecideInicial,
    ajuste: "",
    motivo: "",
  });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof c) => (e: { target: { value: string } }) => setC((x) => ({ ...x, [campo]: e.target.value }));
  const vaiDecidir = desfecho === "decidir" || desfecho === "ajuste";

  function montar(): FechamentoProposta | string {
    if (!desfecho) return "Escolha como a reunião terminou.";
    const valor = lerReais(c.valor);
    if (!valor) return "Informe o valor apresentado.";
    if (desfecho === "ganho") {
      const valorFechado = lerReais(c.fechado);
      return valorFechado ? { desfecho, valor, valorFechado } : "Informe o valor fechado.";
    }
    if (desfecho === "perdido") return c.motivo ? { desfecho, valor, motivo: c.motivo } : "Escolha o motivo.";
    if (!c.data) return "Informe a data da decisão.";
    if (c.data < hoje) return "A data da decisão não pode ser antes de hoje.";
    if (c.quemDecide.trim().length < 2) return "Informe quem decide.";
    return {
      desfecho,
      valor,
      dataDecisao: c.data,
      quemDecide: c.quemDecide.trim(),
      ...(c.ajuste.trim() ? { observacao: c.ajuste.trim() } : {}),
    };
  }

  async function encerrar(e: FormEvent) {
    e.preventDefault();
    const corpo = montar();
    if (typeof corpo === "string") return setErro(corpo);
    setErro("");
    setEnviando(true);
    try {
      if (!(await antesDeEncerrar())) {
        setErro("Ainda há dados sem salvar no servidor. Confira a internet e tente de novo.");
        setEnviando(false);
        return;
      }
      const resposta = await api<{ reuniao: Reuniao; propostaId: number }>(`/api/reunioes/${reuniaoId}/encerrar`, {
        method: "POST",
        body: JSON.stringify(corpo),
      });
      aoEncerrar(corpo.desfecho, resposta);
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form aria-label="Fechamento da proposta" className={estilos.fechamento} onSubmit={encerrar} noValidate>
      <div className={estilos.fechamentoTopo}>
        <h2 className={estilos.subtitulo}>Fechamento</h2>
        <button type="button" className={estilos.sair} onClick={aoVoltar}>
          ← Voltar aos slides
        </button>
      </div>
      <p className="suave">A reunião só termina com o próximo passo registrado: a decisão, a data e quem decide.</p>
      <fieldset className={estilos.resultados}>
        <legend className="suave">Como terminou</legend>
        {RESULTADOS.map((r) => (
          <label key={r.id} className={desfecho === r.id ? estilos.opcaoMarcada : estilos.opcao}>
            <input type="radio" name="desfecho" checked={desfecho === r.id} onChange={() => setDesfecho(r.id)} />
            {r.rotulo}
          </label>
        ))}
      </fieldset>
      {desfecho && <Campo rotulo="Valor apresentado" inputMode="decimal" value={c.valor} onChange={mudar("valor")} />}
      {desfecho === "ganho" && <Campo rotulo="Valor fechado" inputMode="decimal" value={c.fechado} onChange={mudar("fechado")} />}
      {vaiDecidir && (
        <div className={estilos.grade}>
          <Campo rotulo="Data da decisão" type="date" min={hoje} value={c.data} onChange={mudar("data")} />
          <Campo rotulo="Quem decide" maxLength={120} value={c.quemDecide} onChange={mudar("quemDecide")} />
          {desfecho === "ajuste" && <Campo rotulo="O que ajustar" maxLength={500} value={c.ajuste} onChange={mudar("ajuste")} />}
        </div>
      )}
      {desfecho === "perdido" && (
        <Selecao
          rotulo="Motivo"
          vazio="Escolha o motivo"
          value={c.motivo}
          onChange={mudar("motivo")}
          opcoes={MOTIVOS_PERDA.map((m) => ({ valor: m, rotulo: m }))}
        />
      )}
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Encerrar reunião
      </Botao>
    </form>
  );
}
