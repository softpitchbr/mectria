import { useEffect, useState, type FormEvent } from "react";
import { preencherModelo } from "../../../compartilhado/cadencia";
import { GRUPO_CONFIRMACAO, MENSAGEM_GRUPO_MARCADA } from "../../../compartilhado/dados/confirmacao";
import { formatarDia } from "../../../compartilhado/datas";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import AreaDeTexto from "../../componentes/AreaDeTexto";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import { mensagemDe, OPCOES_SERVICO } from "../followup/comum";
import estilos from "./hoje.module.css";

/** Formulário da diagnóstica marcada na ligação: cria a oportunidade e a reunião. */
export default function MarcarDiagnostica({ aoMarcar, aoVoltar, aoRegistrar }: { aoMarcar: () => void; aoVoltar: () => void; aoRegistrar?: () => void }) {
  const [closers, setClosers] = useState<{ id: number; nome: string }[]>([]);
  const [c, setC] = useState({ empresa: "", contato: "", telefone: "", servico: "", closerId: "", data: "", hora: "", formato: "online", observacoes: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagemDoGrupo, setMensagemDoGrupo] = useState<string | null>(null);
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
          ...(c.observacoes.trim() ? { observacoes: c.observacoes.trim() } : {}),
        }),
      });
      await api("/api/ligacoes", { method: "POST", body: JSON.stringify({ resultado: "marcou" }) });
      const closer = closers.find((x) => String(x.id) === c.closerId)?.nome ?? "o closer";
      avisar(`Diagnóstica marcada com ${closer} para ${formatarDia(c.data)} às ${c.hora}.`);
      aoRegistrar?.();
      // Docs/17: ao marcar, o hunter pergunta no Comercial & Projetos se algum projetista pode no horário.
      setMensagemDoGrupo(
        preencherModelo(MENSAGEM_GRUPO_MARCADA, {
          empresa: c.empresa,
          data: formatarDia(c.data),
          hora: c.hora,
          formato: c.formato === "online" ? "online" : "presencial",
        }),
      );
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  async function copiarMensagem() {
    try {
      await navigator.clipboard.writeText(mensagemDoGrupo ?? "");
      avisar("Mensagem copiada.");
    } catch {
      avisar("Não deu para copiar. Selecione o texto e copie.");
    }
  }

  if (mensagemDoGrupo) {
    return (
      <section aria-label={`Mensagem para o ${GRUPO_CONFIRMACAO}`} className={estilos.formulario}>
        <h2>Agora, avise no {GRUPO_CONFIRMACAO}</h2>
        <p className={estilos.mensagemGrupo}>{mensagemDoGrupo}</p>
        <div className={estilos.botoes}>
          <Botao variante="primario" onClick={copiarMensagem}>
            Copiar mensagem
          </Botao>
          <Botao variante="fantasma" onClick={aoMarcar}>
            Voltar às ligações
          </Botao>
        </div>
      </section>
    );
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
      <AreaDeTexto
        rotulo="Observações"
        value={c.observacoes}
        onChange={mudar("observacoes")}
        maxLength={1000}
        placeholder="O que importa da ligação ou do WhatsApp: quem decide, o que chamou a atenção, o melhor canal"
      />
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
