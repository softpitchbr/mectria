import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ROTULO_SITUACAO_SERVICO, urlDaApresentacaoGeral, type ApresentacaoGeral } from "../../../compartilhado/servico";
import { api } from "../../api/cliente";
import VistaDaApresentacao, { dadosDeExemploDaDiagnostica } from "../../apresentacao/VistaDaApresentacao";
import Botao from "../../componentes/Botao";
import Tag from "../../componentes/Tag";
import { useServicos } from "../../servicos/servicos";
import { mensagemDe } from "../followup/comum";
import ApresentacaoEmHtml from "./ApresentacaoEmHtml";
import EditarServico from "./EditarServico";
import estilos from "./Servicos.module.css";

/** A apresentação da diagnóstica, igual para todos: fica no topo de Serviços. */
function ApresentacaoDaDiagnostica() {
  const [geral, setGeral] = useState<ApresentacaoGeral | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api<ApresentacaoGeral[]>("/api/apresentacoes")
      .then((lista) => setGeral(lista.find((g) => g.id === "diagnostica") ?? null))
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!geral) return null;
  return (
    <ApresentacaoEmHtml<ApresentacaoGeral>
      idDoTitulo="titulo-diagnostica"
      titulo="Apresentação da diagnóstica"
      semArquivo="Sem apresentação: a diagnóstica continua sem a janela do cliente."
      aviso="Remover a apresentação da diagnóstica? As diagnósticas voltam a não ter a janela do cliente."
      caminho="/api/apresentacoes/diagnostica"
      arquivo={geral.apresentacao}
      tituloDaVista="Apresentação · Diagnóstica"
      vista={() => <VistaDaApresentacao url={urlDaApresentacaoGeral(geral)!} titulo="Apresentação · Diagnóstica" dados={dadosDeExemploDaDiagnostica()} totalDoRoteiro={null} />}
      aoMudar={setGeral}
    />
  );
}

/** Serviços (só o diretor): o que a MecTRIA vende, com as perguntas técnicas, o roteiro e a apresentação de cada um. */
export default function Servicos() {
  const { id } = useParams();
  const navegar = useNavigate();
  const servicos = useServicos();
  if (id) return <EditarServico key={id} id={id === "novo" ? null : id} />;

  return (
    <div className={estilos.servicos}>
      <header className={estilos.cabeca}>
        <h1>Serviços</h1>
        <p className="suave">
          O que a MecTRIA vende. Em cada serviço ficam as perguntas técnicas da diagnóstica, o roteiro e a apresentação de proposta.
        </p>
        <Botao variante="primario" onClick={() => navegar("/servicos/novo")}>
          Novo serviço
        </Botao>
      </header>
      <ApresentacaoDaDiagnostica />
      {!servicos ? (
        <p className="mono suave">Abrindo os serviços…</p>
      ) : (
        <ul aria-label="Serviços" className={estilos.lista}>
          {servicos.map((s) => (
            <li key={s.id}>
              <span className={`mono ${estilos.sigla}`}>{s.sigla}</span>
              <strong>{s.nome}</strong>
              <span className={estilos.detalhes}>
                {s.situacao !== "ativo" && <Tag tipo={s.situacao === "inativo" ? "neutro" : "hoje"}>{ROTULO_SITUACAO_SERVICO[s.situacao]}</Tag>}
                <span className="suave">{s.apresentacao ? "Apresentação própria" : "Apresentação de exemplo"}</span>
                <span className="suave">
                  {s.perguntas.length} {s.perguntas.length === 1 ? "pergunta técnica" : "perguntas técnicas"}
                </span>
              </span>
              <Link to={`/servicos/${s.id}`} aria-label={`Editar ${s.nome}`}>
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
