import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { formatarDia } from "../../compartilhado/datas";
import { briefingDaFicha, resumoParaCliente } from "../../compartilhado/diagnostica";
import type { FichaCompleta, Reuniao } from "../../compartilhado/oportunidade";
import { api } from "../api/cliente";
import { avisar } from "../componentes/Aviso";
import Botao from "../componentes/Botao";
import type { Eu } from "../sessao/useEu";
import { nomeDoServico, useServicos } from "../servicos/servicos";
import { mensagemDe } from "./followup/comum";
import estilos from "./Briefing.module.css";

function resultadoEmTexto(r: Reuniao): string {
  if (r.situacao === "cancelada") return r.motivo ?? "Reunião cancelada";
  if (r.resultado === "proposta_marcada") return "Proposta marcada";
  if (r.resultado === "nao_qualificou") return `Não qualificou${r.motivo ? `: ${r.motivo}` : ""}`;
  return "Diagnóstica em andamento";
}

/** Briefing da diagnóstica para Projetos: uma página A4 clara, que o navegador salva em PDF. */
export default function Briefing() {
  const { id } = useParams();
  const servicos = useServicos();
  const [ficha, setFicha] = useState<FichaCompleta | null>(null);
  const [erro, setErro] = useState("");
  const eu = useOutletContext<Eu | undefined>();
  const [confirmandoLgpd, setConfirmandoLgpd] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    api<FichaCompleta>(`/api/reunioes/${id}`)
      .then(setFicha)
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, [id, recarga]);

  // O título da página vira o nome do arquivo no "Salvar como PDF".
  useEffect(() => {
    if (ficha?.oportunidade) document.title = `Briefing · ${ficha.oportunidade.empresa} · ${formatarDia(ficha.reuniao.dataHora.slice(0, 10))}`;
  }, [ficha]);

  if (erro)
    return (
      <p role="alert" className={estilos.erro}>
        {erro}
      </p>
    );
  if (!ficha) return <p className="mono suave">Abrindo o briefing…</p>;

  const { reuniao, oportunidade, proximaReuniao: proxima } = ficha;
  const secoes = briefingDaFicha(ficha);
  const quandoProposta = proxima ? `${formatarDia(proxima.dataHora.slice(0, 10))} às ${proxima.dataHora.slice(11, 16)}` : undefined;

  async function copiarResumo() {
    try {
      await navigator.clipboard.writeText(
        resumoParaCliente(ficha!.respostas, oportunidade.contato, { dataProposta: quandoProposta, vendedor: reuniao.closerNome ?? undefined }),
      );
      avisar("Resumo copiado para mandar ao cliente.");
    } catch {
      avisar("Não deu para copiar. Selecione o texto e copie.");
    }
  }

  async function marcarEnviado() {
    try {
      const atualizada = await api<Reuniao>(`/api/reunioes/${reuniao.id}/briefing`, { method: "POST" });
      setFicha({ ...ficha!, reuniao: atualizada });
      avisar("Briefing marcado como enviado para Projetos.");
    } catch (e) {
      avisar(mensagemDe(e));
    }
  }

  async function apagarDadosPessoais() {
    try {
      await api(`/api/oportunidades/${oportunidade.id}/apagar-dados-pessoais`, { method: "POST" });
      avisar(`Dados pessoais de ${oportunidade.empresa} apagados.`);
      setConfirmandoLgpd(false);
      setRecarga((n) => n + 1);
    } catch (e) {
      avisar(mensagemDe(e));
    }
  }

  return (
    <div className={estilos.pagina}>
      <nav className={estilos.acoes} aria-label="Ações do briefing">
        {eu?.cargo === "projetos" ? <Link to="/briefings">← Briefings</Link> : <Link to="/reunioes">← Reuniões</Link>}
        <Botao onClick={copiarResumo}>Copiar resumo para o cliente</Botao>
        {reuniao.briefingEnviadoEm ? (
          <span className="mono suave">Enviado para Projetos</span>
        ) : (
          eu?.cargo !== "projetos" && reuniao.situacao === "concluida" && <Botao onClick={marcarEnviado}>Marcar como enviado para Projetos</Botao>
        )}
        <Botao variante="primario" onClick={() => window.print()}>
          Gerar PDF
        </Botao>
        {eu?.cargo === "diretor" && !confirmandoLgpd && (
          <Botao variante="fantasma" onClick={() => setConfirmandoLgpd(true)}>
            Apagar dados pessoais (LGPD)
          </Botao>
        )}
      </nav>

      {confirmandoLgpd && (
        <div role="group" aria-label="Confirmar exclusão dos dados pessoais" className={estilos.lgpd}>
          <p>
            Isso apaga o contato, telefone, e-mail e quem decide de {oportunidade.empresa}. Os dados do projeto ficam, e o histórico registra o pedido. Não dá
            para desfazer.
          </p>
          <div className={estilos.acoes}>
            <Botao variante="primario" onClick={apagarDadosPessoais}>
              Apagar de vez
            </Botao>
            <Botao variante="fantasma" onClick={() => setConfirmandoLgpd(false)}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}

      <article className={estilos.folha}>
        <header className={estilos.cabeca}>
          <div className={estilos.marca}>MecTRIA</div>
          <div>
            <h1>Briefing para Projetos</h1>
            <p>
              Diagnóstica de {formatarDia(reuniao.dataHora.slice(0, 10))} · {reuniao.dataHora.slice(11, 16)}
            </p>
          </div>
        </header>

        <dl className={estilos.ficha}>
          <div>
            <dt>Cliente</dt>
            <dd>{oportunidade.empresa}</dd>
          </div>
          <div>
            <dt>Contato</dt>
            <dd>{oportunidade.contato || "—"}</dd>
          </div>
          <div>
            <dt>Serviço</dt>
            <dd>{nomeDoServico(servicos, oportunidade.servico)}</dd>
          </div>
          <div>
            <dt>Closer</dt>
            <dd>{reuniao.closerNome ?? "—"}</dd>
          </div>
          <div>
            <dt>Resultado</dt>
            <dd>{resultadoEmTexto(reuniao)}</dd>
          </div>
          {reuniao.observacoes && (
            <div>
              <dt>Observações do hunter</dt>
              <dd>{reuniao.observacoes}</dd>
            </div>
          )}
          {proxima && (
            <>
              <div>
                <dt>Apresentação da proposta</dt>
                <dd>
                  {quandoProposta} · {proxima.formato === "online" ? "online" : "presencial"}
                </dd>
              </div>
              <div>
                <dt>Quem decide</dt>
                <dd>{proxima.quemDecide || "—"}</dd>
              </div>
            </>
          )}
        </dl>

        {secoes.length === 0 && <p className={estilos.vazio}>Nenhuma resposta registrada ainda.</p>}
        {secoes.map((s) => (
          <section key={s.titulo} className={estilos.secao}>
            <h2>{s.titulo}</h2>
            <dl>
              {s.itens.map((i, n) => (
                <div key={n} className={estilos.item}>
                  <dt>{i.pergunta}</dt>
                  <dd>{i.resposta}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <footer className={estilos.rodape}>MecTRIA · Empresa Júnior de Engenharia Mecânica da UFTM · documento interno</footer>
      </article>
    </div>
  );
}
