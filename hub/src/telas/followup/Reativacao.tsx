import { useCallback, useEffect, useState, type FormEvent } from "react";
import { preencherModelo } from "../../../compartilhado/cadencia";
import { MOTIVOS_PERDA, REATIVACAO } from "../../../compartilhado/dados/cadencia";
import { formatarDia, hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { textoDoTempo, type ItemReativacao } from "../../../compartilhado/reativacao";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Foco from "../../componentes/Foco";
import Selecao from "../../componentes/Selecao";
import { mensagemDe } from "./comum";
import { mesesParaRetomar } from "./meses";
import pagina from "../FollowUp.module.css";
import estilos from "./followup.module.css";

type Acao = "reuniao" | "adiar" | "perdida";
const TITULO: Record<Acao, string> = { reuniao: "Marcar reunião", adiar: "Ainda não", perdida: "Perdida" };

/** O formulário de cada saída da reativação: marcar a reunião, adiar para outro mês ou registrar como perdida. */
function FormularioDaAcao({ acao, item, aoConcluir }: { acao: Acao; item: ItemReativacao; aoConcluir: () => void }) {
  const [c, setC] = useState({ data: "", hora: "", formato: "online", retomarEm: "", motivo: "" });
  const [meses] = useState(() => mesesParaRetomar(hojeEmSaoPaulo()));
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo: keyof typeof c) => (e: { target: { value: string } }) => setC((x) => ({ ...x, [campo]: e.target.value }));
  const { empresa, id } = item.oportunidade;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (acao === "reuniao" && (!c.data || !c.hora)) return setErro("Informe a data e a hora da reunião.");
    if (acao === "adiar" && !c.retomarEm) return setErro("Escolha o mês para retomar.");
    if (acao === "perdida" && !c.motivo) return setErro("Escolha o motivo.");
    setErro("");
    setEnviando(true);
    const corpo =
      acao === "reuniao" ? { dataHora: `${c.data}T${c.hora}`, formato: c.formato } : acao === "adiar" ? { retomarEm: c.retomarEm } : { motivo: c.motivo };
    try {
      await api(`/api/reativacao/${id}/${acao}`, { method: "POST", body: JSON.stringify(corpo) });
      avisar(
        acao === "reuniao"
          ? `Reunião marcada com ${empresa}. A oportunidade voltou para a agenda.`
          : acao === "adiar"
            ? `${empresa} volta em ${meses.find((m) => m.valor === c.retomarEm)?.rotulo ?? c.retomarEm}.`
            : `${empresa}: perdida.`,
      );
      aoConcluir();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form className={estilos.resultado} onSubmit={enviar} noValidate>
      {acao === "reuniao" && (
        <>
          <Campo rotulo="Data" type="date" min={hojeEmSaoPaulo()} value={c.data} onChange={mudar("data")} />
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
        </>
      )}
      {acao === "adiar" && <Selecao rotulo="Retomar em" vazio="Escolha o mês" value={c.retomarEm} onChange={mudar("retomarEm")} opcoes={meses} />}
      {acao === "perdida" && (
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
        {acao === "reuniao" ? "Marcar a reunião" : acao === "adiar" ? "Guardar o novo mês" : "Registrar como perdida"}
      </Botao>
    </form>
  );
}

/** Aba Reativação: as oportunidades em nutrição cujo mês de retomar chegou, das mais antigas para as mais novas. */
export default function Reativacao() {
  const [lista, setLista] = useState<ItemReativacao[] | null>(null);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<{ acao: Acao; item: ItemReativacao; origem: HTMLElement } | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLista(await api<ItemReativacao[]>("/api/reativacao"));
      setErro("");
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Mensagem copiada.");
    } catch {
      avisar("Não deu para copiar. Selecione o texto e copie.");
    }
  }

  if (erro)
    return (
      <p role="alert" className={estilos.erro}>
        {erro}
      </p>
    );
  if (!lista) return <p className="mono suave">Carregando…</p>;
  if (lista.length === 0) return <p className={`suave ${pagina.vazio}`}>Nenhuma oportunidade para reativar hoje. Elas aparecem aqui no mês combinado.</p>;

  return (
    <>
      <ul className={pagina.lista}>
        {lista.map((item) => {
          const tempo = textoDoTempo(item.mesesDesde);
          const texto = preencherModelo(REATIVACAO.modelo, { contato: item.oportunidade.contato, tempo });
          return (
            <li key={item.oportunidade.id}>
              <article aria-label={`Reativar ${item.oportunidade.empresa}`} className={estilos.reativar}>
                <p className={pagina.linhaTopo}>
                  <strong>{item.oportunidade.empresa}</strong>
                  <span className="suave">
                    {item.oportunidade.contato} · conversamos há {tempo}
                    {item.ultimaReuniao ? ` (${formatarDia(item.ultimaReuniao)})` : ""}
                  </span>
                </p>
                <p aria-label="Mensagem de reativação" className={estilos.mensagem}>
                  {texto}
                </p>
                <div className={estilos.acoes}>
                  <Botao onClick={() => copiar(texto)}>Copiar mensagem</Botao>
                  {(Object.keys(TITULO) as Acao[]).map((acao) => (
                    <Botao
                      key={acao}
                      variante={acao === "reuniao" ? "secundario" : "fantasma"}
                      onClick={(e) => setAberta({ acao, item, origem: e.currentTarget })}
                    >
                      {TITULO[acao]}
                    </Botao>
                  ))}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {aberta && (
        <Foco titulo={`${TITULO[aberta.acao]} · ${aberta.item.oportunidade.empresa}`} origem={aberta.origem} aoSair={() => setAberta(null)}>
          <FormularioDaAcao
            acao={aberta.acao}
            item={aberta.item}
            aoConcluir={() => {
              setAberta(null);
              void carregar();
            }}
          />
        </Foco>
      )}
    </>
  );
}
