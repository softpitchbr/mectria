import { useEffect, useState, type FormEvent } from "react";
import { formatarDia } from "../../../compartilhado/datas";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import { mensagemDe, OPCOES_SERVICO } from "../followup/comum";
import estilos from "./hoje.module.css";

/** Formulário da diagnóstica marcada na ligação: cria a oportunidade e a reunião. */
export default function MarcarDiagnostica({ aoMarcar, aoVoltar }: { aoMarcar: () => void; aoVoltar: () => void }) {
  const [closers, setClosers] = useState<{ id: number; nome: string }[]>([]);
  const [c, setC] = useState({ empresa: "", contato: "", telefone: "", servico: "", closerId: "", data: "", hora: "", formato: "online" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof c) => (e: { target: { value: string } }) => setC((x) => ({ ...x, [campo]: e.target.value }));

  useEffect(() => {
    api<{ id: number; nome: string }[]>("/api/closers")
      .then(setClosers)
      .catch(() => setClosers([]));
  }, []);

  async function marcar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await api("/api/oportunidades", {
        method: "POST",
        body: JSON.stringify({
          empresa: c.empresa,
          contato: c.contato,
          telefone: c.telefone,
          servico: c.servico,
          closerId: Number(c.closerId) || 0,
          dataHora: `${c.data}T${c.hora}`,
          formato: c.formato,
        }),
      });
      await api("/api/ligacoes", { method: "POST", body: JSON.stringify({ resultado: "marcou" }) });
      const closer = closers.find((x) => String(x.id) === c.closerId)?.nome ?? "o closer";
      avisar(`Diagnóstica marcada com ${closer} para ${formatarDia(c.data)} às ${c.hora}.`);
      aoMarcar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form aria-label="Marcar diagnóstica" className={estilos.formulario} onSubmit={marcar} noValidate>
      <h2>Diagnóstica marcada</h2>
      <div className={estilos.grade}>
        <Campo rotulo="Empresa" value={c.empresa} onChange={mudar("empresa")} />
        <Campo rotulo="Contato" value={c.contato} onChange={mudar("contato")} />
        <Campo rotulo="Telefone" inputMode="tel" value={c.telefone} onChange={mudar("telefone")} />
        <Selecao rotulo="Serviço" vazio="Escolha o serviço" value={c.servico} onChange={mudar("servico")} opcoes={OPCOES_SERVICO} />
        <Selecao
          rotulo="Closer"
          vazio="Escolha o closer"
          value={c.closerId}
          onChange={mudar("closerId")}
          opcoes={closers.map((x) => ({ valor: String(x.id), rotulo: x.nome }))}
        />
        <Selecao
          rotulo="Formato"
          value={c.formato}
          onChange={mudar("formato")}
          opcoes={[
            { valor: "online", rotulo: "Online" },
            { valor: "presencial", rotulo: "Visita técnica (presencial)" },
          ]}
        />
        <Campo rotulo="Data" type="date" value={c.data} onChange={mudar("data")} />
        <Campo rotulo="Hora" type="time" value={c.hora} onChange={mudar("hora")} />
      </div>
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <div className={estilos.botoes}>
        <Botao variante="primario" type="submit" disabled={enviando}>
          Marcar diagnóstica
        </Botao>
        <Botao variante="fantasma" onClick={aoVoltar}>
          Voltar às ligações
        </Botao>
      </div>
    </form>
  );
}
