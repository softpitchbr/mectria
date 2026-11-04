import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ROTULO_TOQUE, canalDoToque } from "../../compartilhado/cadencia";
import { formatarDia, formatarReais } from "../../compartilhado/datas";
import type { EstadoFollowup, ItemFollowup } from "../../compartilhado/oportunidade";
import { api } from "../api/cliente";
import Botao from "../componentes/Botao";
import Foco from "../componentes/Foco";
import Tag from "../componentes/Tag";
import type { Eu } from "../sessao/useEu";
import { mensagemDe, nomeDoServico } from "./followup/comum";
import NovaProposta from "./followup/NovaProposta";
import Resultado from "./followup/Resultado";
import Reativacao from "./followup/Reativacao";
import ToqueEmFoco from "./followup/ToqueEmFoco";
import estilos from "./FollowUp.module.css";

type Aberto =
  | { tipo: "toque"; item: ItemFollowup; origem: HTMLElement | null }
  | { tipo: "resultado"; item: ItemFollowup; origem: HTMLElement | null }
  | { tipo: "nova"; origem: HTMLElement | null };

const GRUPOS: { estado: EstadoFollowup; titulo: string }[] = [
  { estado: "atrasado", titulo: "Atrasados" },
  { estado: "hoje", titulo: "Hoje" },
  { estado: "em_dia", titulo: "Próximos" },
  { estado: "sem_toque", titulo: "Sem toque" },
];

function CartaoDaProposta({ item, eu, aoAbrir }: { item: ItemFollowup; eu: Eu; aoAbrir: (origem: HTMLElement) => void }) {
  const { oportunidade, proposta, proximo } = item;
  return (
    <button type="button" className={estilos.cartao} onClick={(e) => aoAbrir(e.currentTarget)}>
      <span className={estilos.linhaTopo}>
        <strong>{oportunidade.empresa}</strong>
        {item.estado === "atrasado" && (
          <Tag tipo="atrasado">
            Atrasado · {item.atrasados} {item.atrasados === 1 ? "toque" : "toques"}
          </Tag>
        )}
        {item.estado === "hoje" && <Tag tipo="hoje">Hoje</Tag>}
      </span>
      <span className="suave">
        {nomeDoServico(proposta.servico)} · <span className={`mono ${estilos.valor}`}>{formatarReais(proposta.valor)}</span>
      </span>
      <span className={`mono ${estilos.toque}`}>
        {proximo ? (
          <>
            <span className={estilos.codigo}>{ROTULO_TOQUE[proximo.codigo] ?? proximo.codigo}</span> {canalDoToque(proximo.codigo)} ·{" "}
            {formatarDia(proximo.previstoPara)}
          </>
        ) : (
          "Cadência terminada: registre o resultado"
        )}
      </span>
      {item.respostasTecnicas?.length ? (
        <span className={estilos.respostaTecnica}>Projetos respondeu: {item.respostasTecnicas[item.respostasTecnicas.length - 1].resposta}</span>
      ) : null}
      {eu.cargo === "diretor" && oportunidade.closerNome && <span className="suave">Closer: {oportunidade.closerNome}</span>}
    </button>
  );
}

/** Follow-up: as propostas na rua, atrasados primeiro, e cada toque em modo foco. */
export default function FollowUp({ eu }: { eu: Eu }) {
  const [lista, setLista] = useState<ItemFollowup[] | null>(null);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState<Aberto | null>(null);
  const [busca, setBusca] = useSearchParams();

  const carregar = useCallback(async () => {
    try {
      setLista(await api<ItemFollowup[]>("/api/followup"));
      setErro("");
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Links da rotina e do Hoje: ?proposta=ID abre o próximo toque da proposta (?toque=ID também funciona).
  const aba = busca.get("aba") === "reativacao" ? "reativacao" : "propostas";
  const propostaPedida = busca.get("proposta");
  const toquePedido = busca.get("toque");
  useEffect(() => {
    if (!lista || (!propostaPedida && !toquePedido)) return;
    const item = lista.find((i) => String(i.proposta.id) === propostaPedida || String(i.proximo?.id) === toquePedido);
    if (item) setAberto(item.proximo ? { tipo: "toque", item, origem: null } : { tipo: "resultado", item, origem: null });
  }, [lista, propostaPedida, toquePedido]);

  function fechar() {
    setAberto(null);
    if (propostaPedida || toquePedido) setBusca({}, { replace: true });
  }

  function depoisDeRegistrar() {
    fechar();
    void carregar();
  }

  function abrirItem(item: ItemFollowup, origem: HTMLElement) {
    setAberto(item.proximo ? { tipo: "toque", item, origem } : { tipo: "resultado", item, origem });
  }

  const atrasados = lista?.filter((i) => i.estado === "atrasado").length ?? 0;

  return (
    <div className={estilos.followup}>
      <header className={estilos.cabeca}>
        <div>
          <h1>Follow-up</h1>
          {lista && (
            <p className="mono suave">
              {lista.length} na rua · {atrasados} {atrasados === 1 ? "atrasado" : "atrasados"}
            </p>
          )}
        </div>
        <Botao variante={aberto ? "secundario" : "primario"} onClick={(e) => setAberto({ tipo: "nova", origem: e.currentTarget })}>
          Registrar proposta apresentada
        </Botao>
      </header>

      <div role="tablist" aria-label="Follow-up e reativação" className={estilos.abas}>
        {(
          [
            ["propostas", "Propostas"],
            ["reativacao", "Reativação"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            className={estilos.aba}
            onClick={() => setBusca(id === "reativacao" ? { aba: "reativacao" } : {}, { replace: true })}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "reativacao" && <Reativacao />}

      {aba === "propostas" && erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      {aba === "propostas" && lista === null && !erro && <p className="mono suave">Carregando…</p>}
      {aba === "propostas" && lista?.length === 0 && (
        <p className={`suave ${estilos.vazio}`}>Nenhuma proposta na rua. Registre a próxima proposta apresentada para o hub montar os toques.</p>
      )}

      {aba === "propostas" &&
        lista &&
        GRUPOS.map(({ estado, titulo }) => {
          const doGrupo = lista.filter((i) => i.estado === estado);
          if (doGrupo.length === 0) return null;
          return (
            <section key={estado} className={estilos.grupo}>
              <h2 className="mono">
                {titulo} <span className="suave">{doGrupo.length}</span>
              </h2>
              <ul className={estilos.lista}>
                {doGrupo.map((item) => (
                  <li key={item.proposta.id}>
                    <CartaoDaProposta item={item} eu={eu} aoAbrir={(origem) => abrirItem(item, origem)} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      {aberto?.tipo === "toque" && (
        <Foco
          titulo={`Toque ${ROTULO_TOQUE[aberto.item.proximo!.codigo] ?? aberto.item.proximo!.codigo} · ${aberto.item.oportunidade.empresa}`}
          origem={aberto.origem}
          aoSair={fechar}
        >
          <ToqueEmFoco
            item={aberto.item}
            eu={eu}
            aoRegistrar={depoisDeRegistrar}
            aoPedirResultado={() => setAberto({ tipo: "resultado", item: aberto.item, origem: aberto.origem })}
          />
        </Foco>
      )}
      {aberto?.tipo === "resultado" && (
        <Foco titulo={`Resultado · ${aberto.item.oportunidade.empresa}`} origem={aberto.origem} aoSair={fechar}>
          <Resultado item={aberto.item} aoRegistrar={depoisDeRegistrar} />
        </Foco>
      )}
      {aberto?.tipo === "nova" && (
        <Foco titulo="Registrar proposta apresentada" origem={aberto.origem} aoSair={fechar}>
          <NovaProposta eu={eu} aoRegistrar={depoisDeRegistrar} />
        </Foco>
      )}
    </div>
  );
}
