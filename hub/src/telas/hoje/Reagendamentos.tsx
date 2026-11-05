import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatarDia, hojeEmSaoPaulo } from "../../../compartilhado/datas";
import type { Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Foco from "../../componentes/Foco";
import Painel from "../../componentes/Painel";
import Selecao from "../../componentes/Selecao";
import { mensagemDe } from "../followup/comum";
import estilos from "./hoje.module.css";

function FormularioDeReagendar({ reuniao, aoReagendar }: { reuniao: Reuniao; aoReagendar: () => void }) {
  const [c, setC] = useState({ data: "", hora: "", formato: reuniao.formato as string });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof c) => (e: { target: { value: string } }) => setC((x) => ({ ...x, [campo]: e.target.value }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!c.data || !c.hora) return setErro("Informe a data e a hora da reunião.");
    setErro("");
    setEnviando(true);
    try {
      await api(`/api/oportunidades/${reuniao.oportunidadeId}/reagendar`, {
        method: "POST",
        body: JSON.stringify({ dataHora: `${c.data}T${c.hora}`, formato: c.formato }),
      });
      avisar(`Diagnóstica com ${reuniao.empresa} reagendada para ${formatarDia(c.data)} às ${c.hora}.`);
      aoReagendar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form className={estilos.formulario} onSubmit={enviar} noValidate>
      <div className={estilos.grade}>
        <Campo rotulo="Data" type="date" min={hojeEmSaoPaulo()} value={c.data} onChange={mudar("data")} />
        <Campo rotulo="Hora" type="time" value={c.hora} onChange={mudar("hora")} />
        <Selecao
          rotulo="Formato"
          value={c.formato}
          onChange={mudar("formato")}
          opcoes={[
            { valor: "online", rotulo: "Online" },
            { valor: "presencial", rotulo: "Visita técnica (presencial)" },
          ]}
        />
      </div>
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Reagendar a diagnóstica
      </Botao>
    </form>
  );
}

/** As diagnósticas em que o cliente não compareceu, para o hunter marcar de novo (docs/17, seção 1). */
export default function Reagendamentos({ aoReagendar }: { aoReagendar: () => void }) {
  const [lista, setLista] = useState<Reuniao[]>([]);
  const [aberta, setAberta] = useState<{ reuniao: Reuniao; origem: HTMLElement } | null>(null);

  const carregar = useCallback(() => {
    api<Reuniao[]>("/api/reagendamentos")
      .then(setLista)
      .catch(() => setLista([]));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (lista.length === 0) return null;

  return (
    <Painel>
      <h2 className={estilos.subtitulo}>Reagendar quem não compareceu</h2>
      <ul className={estilos.lista} aria-label="Reagendar">
        {lista.map((r) => (
          <li key={r.id}>
            <span className="mono">{formatarDia(r.dataHora.slice(0, 10))}</span>
            <span>{r.empresa}</span>
            <Botao aria-label={`Reagendar ${r.empresa}`} onClick={(e) => setAberta({ reuniao: r, origem: e.currentTarget })}>
              Reagendar
            </Botao>
          </li>
        ))}
      </ul>
      {aberta && (
        <Foco titulo={`Reagendar · ${aberta.reuniao.empresa}`} origem={aberta.origem} aoSair={() => setAberta(null)}>
          <FormularioDeReagendar
            reuniao={aberta.reuniao}
            aoReagendar={() => {
              setAberta(null);
              carregar();
              aoReagendar();
            }}
          />
        </Foco>
      )}
    </Painel>
  );
}
