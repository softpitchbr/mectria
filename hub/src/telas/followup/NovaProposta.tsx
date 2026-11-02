import { useEffect, useState, type FormEvent } from "react";
import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import type { Oportunidade } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import AreaDeTexto from "../../componentes/AreaDeTexto";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import { mensagemDe, OPCOES_SERVICO } from "./comum";
import estilos from "./followup.module.css";

/** Registra uma proposta apresentada (até a fase 4, e depois para as apresentadas fora do hub). */
export default function NovaProposta({ aoRegistrar }: { aoRegistrar: () => void }) {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [oportunidadeId, setOportunidadeId] = useState("");
  const [campos, setCampos] = useState({
    empresa: "",
    contato: "",
    telefone: "",
    servico: "",
    valor: "",
    apresentadaEm: hojeEmSaoPaulo(),
    dataDecisao: "",
    quemDecide: "",
    dor: "",
    validade: "",
  });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof campos) => (e: { target: { value: string } }) => setCampos((c) => ({ ...c, [campo]: e.target.value }));

  useEffect(() => {
    api<Oportunidade[]>("/api/oportunidades")
      .then((lista) => setOportunidades(lista.filter((o) => o.situacao === "diagnostica_marcada" || o.situacao === "proposta_marcada")))
      .catch(() => setOportunidades([]));
  }, []);

  function escolherOportunidade(id: string) {
    setOportunidadeId(id);
    const o = oportunidades.find((x) => String(x.id) === id);
    if (o) setCampos((c) => ({ ...c, servico: o.servico }));
  }

  async function registrar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const nova = oportunidadeId === "";
    const corpo: Record<string, unknown> = {
      ...(nova ? { empresa: campos.empresa, contato: campos.contato, telefone: campos.telefone } : { oportunidadeId: Number(oportunidadeId) }),
      servico: campos.servico,
      valor: campos.valor,
      apresentadaEm: campos.apresentadaEm,
      quemDecide: campos.quemDecide,
    };
    if (campos.dataDecisao) corpo.dataDecisao = campos.dataDecisao;
    if (campos.dor.trim()) corpo.dor = campos.dor;
    if (campos.validade) corpo.validade = campos.validade;
    try {
      const { toques } = await api<{ toques: unknown[] }>("/api/propostas", { method: "POST", body: JSON.stringify(corpo) });
      avisar(`Proposta registrada. ${toques.length} toques na agenda.`);
      aoRegistrar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form aria-label="Nova proposta" className={estilos.nova} onSubmit={registrar} noValidate>
      <p className="suave">
        Registre a proposta logo depois de apresentar: o hub monta os toques de follow-up (D0 a D15) em dias úteis.
      </p>
      <Selecao
        rotulo="Oportunidade"
        value={oportunidadeId}
        onChange={(e) => escolherOportunidade(e.target.value)}
        opcoes={[{ valor: "", rotulo: "Empresa nova" }, ...oportunidades.map((o) => ({ valor: String(o.id), rotulo: `${o.empresa} · ${o.contato}` }))]}
      />
      <div className={estilos.grade}>
        {oportunidadeId === "" && (
          <>
            <Campo rotulo="Empresa" value={campos.empresa} onChange={mudar("empresa")} />
            <Campo rotulo="Contato" value={campos.contato} onChange={mudar("contato")} />
            <Campo rotulo="Telefone" inputMode="tel" value={campos.telefone} onChange={mudar("telefone")} />
          </>
        )}
        <Selecao rotulo="Serviço" vazio="Escolha o serviço" value={campos.servico} onChange={mudar("servico")} opcoes={OPCOES_SERVICO} />
        <Campo rotulo="Valor" inputMode="decimal" placeholder="12.500,00" value={campos.valor} onChange={mudar("valor")} />
        <Campo rotulo="Apresentada em" type="date" value={campos.apresentadaEm} onChange={mudar("apresentadaEm")} />
        <Campo rotulo="Decisão combinada para" type="date" value={campos.dataDecisao} onChange={mudar("dataDecisao")} />
        <Campo rotulo="Quem decide" value={campos.quemDecide} onChange={mudar("quemDecide")} />
        <Campo rotulo="Validade da proposta" type="date" value={campos.validade} onChange={mudar("validade")} />
      </div>
      <AreaDeTexto rotulo="Dor do cliente, nas palavras dele" value={campos.dor} onChange={mudar("dor")} maxLength={500} />
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Registrar proposta
      </Botao>
    </form>
  );
}
