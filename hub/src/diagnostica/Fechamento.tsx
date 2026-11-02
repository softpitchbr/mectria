import { useState, type FormEvent } from "react";
import { DIAGNOSTICA, MOTIVOS_NAO_QUALIFICOU } from "../../compartilhado/dados/diagnostica";
import { resumoDoFechamento, type Respostas } from "../../compartilhado/diagnostica";
import { api } from "../api/cliente";
import Botao from "../componentes/Botao";
import Campo from "../componentes/Campo";
import Selecao from "../componentes/Selecao";
import { mensagemDe } from "../telas/followup/comum";
import estilos from "./Painel.module.css";

/** Fechamento obrigatório: o resumo, o pacto e o próximo passo (proposta marcada ou não qualificou). */
export default function Fechamento({
  reuniaoId,
  contato,
  respostas,
  antesDeEncerrar,
  aoEncerrar,
}: {
  reuniaoId: number;
  contato: string;
  respostas: Respostas;
  antesDeEncerrar: () => Promise<void>;
  aoEncerrar: () => void;
}) {
  const [resultado, setResultado] = useState<"proposta_marcada" | "nao_qualificou" | null>(null);
  const [c, setC] = useState({ data: "", hora: "", formato: "online", quemDecide: "", motivo: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof c) => (e: { target: { value: string } }) => setC((x) => ({ ...x, [campo]: e.target.value }));

  async function encerrar(e: FormEvent) {
    e.preventDefault();
    if (!resultado) return setErro("Escolha como a diagnóstica terminou.");
    if (resultado === "proposta_marcada" && (!c.data || !c.hora || c.quemDecide.trim().length < 2)) {
      return setErro("Informe a data, a hora e quem decide.");
    }
    if (resultado === "nao_qualificou" && !c.motivo) return setErro("Escolha o motivo.");
    setErro("");
    setEnviando(true);
    try {
      await antesDeEncerrar();
      const corpo =
        resultado === "proposta_marcada"
          ? { resultado, dataHora: `${c.data}T${c.hora}`, formato: c.formato, quemDecide: c.quemDecide.trim() }
          : { resultado, motivo: c.motivo };
      await api(`/api/reunioes/${reuniaoId}/encerrar`, { method: "POST", body: JSON.stringify(corpo) });
      aoEncerrar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form aria-label="Fechamento da diagnóstica" className={estilos.fechamento} onSubmit={encerrar} noValidate>
      <section>
        <p className={`mono ${estilos.sobre}`}>RESUMO</p>
        <p className={estilos.fala}>{resumoDoFechamento(respostas, contato)}</p>
      </section>
      <section>
        <p className={`mono ${estilos.sobre}`}>PACTO</p>
        <p className={estilos.fala}>{DIAGNOSTICA.fechamento.pacto}</p>
        <p className="suave">{DIAGNOSTICA.fechamento.pactoDica}</p>
      </section>
      <fieldset className={estilos.resultados}>
        <legend className="suave">Como terminou</legend>
        <label className={resultado === "proposta_marcada" ? estilos.opcaoMarcada : estilos.opcao}>
          <input type="radio" name="resultado" checked={resultado === "proposta_marcada"} onChange={() => setResultado("proposta_marcada")} />
          Proposta marcada
        </label>
        <label className={resultado === "nao_qualificou" ? estilos.opcaoMarcada : estilos.opcao}>
          <input type="radio" name="resultado" checked={resultado === "nao_qualificou"} onChange={() => setResultado("nao_qualificou")} />
          Não qualificou
        </label>
      </fieldset>
      {resultado === "proposta_marcada" && (
        <div className={estilos.grade}>
          <Campo rotulo="Data da apresentação" type="date" value={c.data} onChange={mudar("data")} />
          <Campo rotulo="Hora" type="time" value={c.hora} onChange={mudar("hora")} />
          <Selecao
            rotulo="Formato"
            value={c.formato}
            onChange={mudar("formato")}
            opcoes={[
              { valor: "online", rotulo: "Online" },
              { valor: "presencial", rotulo: "Presencial" },
            ]}
          />
          <Campo rotulo="Quem decide" value={c.quemDecide} onChange={mudar("quemDecide")} />
        </div>
      )}
      {resultado === "nao_qualificou" && (
        <Selecao rotulo="Motivo" vazio="Escolha o motivo" value={c.motivo} onChange={mudar("motivo")} opcoes={MOTIVOS_NAO_QUALIFICOU.map((m) => ({ valor: m, rotulo: m }))} />
      )}
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Encerrar diagnóstica
      </Botao>
    </form>
  );
}
