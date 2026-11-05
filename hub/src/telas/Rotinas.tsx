import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ROTULO_CARGO, type Cargo } from "../../compartilhado/cargos";
import { formatarDia } from "../../compartilhado/datas";
import type { DiaDeRotina, ItemRotina, ResumoPessoa } from "../../compartilhado/oportunidade";
import { api, ErroApi } from "../api/cliente";
import Medidor from "../componentes/Medidor";
import Painel from "../componentes/Painel";
import type { Eu } from "../sessao/useEu";
import estilos from "./Rotinas.module.css";

const mensagemDe = (e: unknown) => (e instanceof ErroApi ? e.mensagem : "Algo deu errado. Tente de novo.");

function Check({ feito }: { feito: boolean }) {
  return (
    <svg className={estilos.check} data-feito={feito} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" />
      <path d="M4.5 8.3 7 10.7 11.6 5.6" />
    </svg>
  );
}

function LinhaDoItem({ item, aoMarcar }: { item: ItemRotina; aoMarcar: (chave: string, feito: boolean) => void }) {
  const titulo = item.link ? <Link to={item.link}>{item.titulo}</Link> : <span>{item.titulo}</span>;
  return (
    <li className={item.feito ? `${estilos.item} ${estilos.feito}` : estilos.item}>
      {item.automatico ? (
        <span className={estilos.marca}>
          <Check feito={item.feito} />
          <span className={estilos.titulo}>{titulo}</span>
        </span>
      ) : (
        <label className={estilos.marca}>
          <input type="checkbox" checked={item.feito} onChange={(e) => aoMarcar(item.chave, e.target.checked)} />
          <Check feito={item.feito} />
          <span className={estilos.titulo}>{item.titulo}</span>
        </label>
      )}
      {item.contagem && (
        <span className={`mono ${estilos.contagem}`}>
          {item.contagem.feitas}/{item.contagem.meta}
        </span>
      )}
      {item.automatico && !item.contagem && <span className={`mono ${estilos.sozinho}`}>marca sozinho</span>}
    </li>
  );
}

/** % do dia: feitos sobre o total (0% quando a rotina está vazia). */
export function percentualDaRotina(feitos: number, total: number): string {
  return `${total === 0 ? 0 : Math.round((feitos / total) * 100)}%`;
}

/** O checklist do dia, em blocos de prioridade (docs/17); usado aqui e no Hoje. */
export function ChecklistDaRotina({ dia, aoMarcar }: { dia: DiaDeRotina; aoMarcar: (chave: string, feito: boolean) => void }) {
  if (dia.blocos?.length) {
    return (
      <div className={estilos.blocos}>
        {dia.blocos.map((b, i) => {
          const itens = dia.itens.filter((item) => item.bloco === b.id);
          return (
            <section key={b.id} aria-label={b.titulo} className={estilos.bloco}>
              <header className={estilos.cabecaDoBloco}>
                <h3>
                  <span className="mono suave">{i + 1}.</span> {b.titulo}
                </h3>
                <span className="mono suave">
                  {b.feitos} de {b.total}
                </span>
              </header>
              {b.orientacao && <p className={`suave ${estilos.orientacao}`}>{b.orientacao}</p>}
              {itens.length === 0 ? (
                <p className="suave">Nada neste bloco hoje.</p>
              ) : (
                <ul className={estilos.checklist} aria-label={`Itens de ${b.titulo}`}>
                  {itens.map((item) => (
                    <LinhaDoItem key={item.chave} item={item} aoMarcar={aoMarcar} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    );
  }
  return (
    <ul className={estilos.checklist} aria-label="Itens da rotina">
      {dia.itens.map((item) => (
        <LinhaDoItem key={item.chave} item={item} aoMarcar={aoMarcar} />
      ))}
    </ul>
  );
}

/** Carrega a rotina de hoje e marca itens (para a tela e para o Hoje). */
export function useRotinaDeHoje() {
  const [dia, setDia] = useState<DiaDeRotina | null>(null);
  const [erro, setErro] = useState("");
  const recarregar = useCallback(() => {
    api<DiaDeRotina>("/api/rotina")
      .then(setDia)
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);
  useEffect(recarregar, [recarregar]);
  const marcar = useCallback(async (chave: string, feito: boolean) => {
    setErro("");
    try {
      setDia(await api<DiaDeRotina>(`/api/rotina/${encodeURIComponent(chave)}`, { method: "PUT", body: JSON.stringify({ feito }) }));
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, []);
  return { dia, erro, marcar, recarregar };
}

function Segmentos({ feitos, total }: { feitos: number; total: number }) {
  return (
    <span className={estilos.segmentos} aria-hidden="true">
      {Array.from({ length: Math.max(total, 1) }, (_, i) => (
        <span key={i} className={i < feitos ? estilos.segmentoFeito : estilos.segmento} />
      ))}
    </span>
  );
}

function RotinaPessoal() {
  const { dia, erro, marcar } = useRotinaDeHoje();
  const [historico, setHistorico] = useState<{ dia: string; feitos: number; total: number }[]>([]);
  useEffect(() => {
    api<typeof historico>("/api/rotina/historico")
      .then(setHistorico)
      .catch(() => setHistorico([]));
  }, []);

  return (
    <>
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      {dia && (
        <Painel className={estilos.hoje}>
          <Medidor
            rotulo="Rotina de hoje"
            valor={dia.feitos}
            total={dia.total}
            texto={`${percentualDaRotina(dia.feitos, dia.total)} · ${dia.feitos}/${dia.total}`}
          />
          <ChecklistDaRotina dia={dia} aoMarcar={marcar} />
        </Painel>
      )}
      {historico.length > 0 && (
        <section className={estilos.secao}>
          <h2>Últimos 14 dias úteis</h2>
          <ul className={estilos.historico} aria-label="Últimos 14 dias úteis">
            {historico.map((h) => (
              <li key={h.dia}>
                <span className="mono">{formatarDia(h.dia)}</span>
                {h.total === 0 ? (
                  <span className="suave">Não abriu</span>
                ) : (
                  <>
                    <Segmentos feitos={h.feitos} total={h.total} />
                    <span className="mono suave">
                      {h.feitos}/{h.total}
                    </span>
                    {h.feitos === h.total && <span className={estilos.cumprida}>Cumprida</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** Para o diretor: quem cumpriu a rotina hoje e quem tem follow-up atrasado. */
export function RotinaDoTime({ pessoas }: { pessoas: ResumoPessoa[] }) {
  return (
    <ul className={estilos.time} aria-label="Rotina do time hoje">
      {pessoas.map((p) => (
        <li key={p.pessoa.id}>
          <span className={estilos.nome}>{p.pessoa.nome}</span>
          <span className="suave">{ROTULO_CARGO[p.pessoa.cargo as Cargo] ?? p.pessoa.cargo}</span>
          <Segmentos feitos={p.rotina.feitos} total={p.rotina.total} />
          <span className="mono">
            {percentualDaRotina(p.rotina.feitos, p.rotina.total)}{" "}
            <span className="suave">
              · {p.rotina.feitos}/{p.rotina.total}
            </span>
          </span>
          <span className={p.atrasados > 0 ? estilos.atrasado : "suave"}>
            {p.atrasados === 0 ? "em dia" : `${p.atrasados} ${p.atrasados === 1 ? "atrasado" : "atrasados"}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RotinaDoTimeCarregada() {
  const [pessoas, setPessoas] = useState<ResumoPessoa[] | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    api<{ pessoas: ResumoPessoa[] }>("/api/time/resumo")
      .then((r) => setPessoas(r.pessoas))
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);
  return (
    <>
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      {pessoas && (
        <Painel>
          <h2 className={estilos.subtitulo}>Rotina do time hoje</h2>
          <RotinaDoTime pessoas={pessoas} />
        </Painel>
      )}
    </>
  );
}

/** Rotinas: o checklist do dia do cargo e o histórico; o diretor vê o time. */
export default function Rotinas({ eu }: { eu: Eu }) {
  return (
    <div className={estilos.rotinas}>
      <header>
        <h1>Rotinas</h1>
        <p className="suave">
          {eu.cargo === "diretor"
            ? "Quem cumpriu a rotina hoje e quem tem follow-up atrasado."
            : "O que o seu dia precisa ter. Os itens automáticos se marcam sozinhos."}
        </p>
      </header>
      {eu.cargo === "diretor" ? <RotinaDoTimeCarregada /> : <RotinaPessoal />}
    </div>
  );
}
