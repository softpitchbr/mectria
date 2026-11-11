import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ROTULO_SITUACAO_SERVICO, type DadosDoServico, type Servico, type SituacaoServico, type SlideDoRoteiro } from "../../../compartilhado/servico";
import { api } from "../../api/cliente";
import AreaDeTexto from "../../componentes/AreaDeTexto";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Campo from "../../componentes/Campo";
import Selecao from "../../componentes/Selecao";
import { recarregarServicos } from "../../servicos/servicos";
import { mensagemDe } from "../followup/comum";
import { itensDasLinhas, type PerguntaEmEdicao } from "./edicao";
import EditorDePerguntas from "./EditorDePerguntas";
import EditorDoRoteiro from "./EditorDoRoteiro";
import estilos from "./EditarServico.module.css";

const SITUACOES = (Object.keys(ROTULO_SITUACAO_SERVICO) as SituacaoServico[]).map((s) => ({ valor: s, rotulo: ROTULO_SITUACAO_SERVICO[s] }));

interface Campos {
  nome: string;
  sigla: string;
  resumo: string;
  dores: string;
  entregamos: string;
  ficaComCliente: string;
  ancoraValor: string;
  situacao: SituacaoServico;
}

const VAZIO: Campos = { nome: "", sigla: "", resumo: "", dores: "", entregamos: "", ficaComCliente: "", ancoraValor: "", situacao: "ativo" };

const camposDe = (s: Servico): Campos => ({
  nome: s.nome,
  sigla: s.sigla,
  resumo: s.resumo,
  dores: s.dores.join("\n"),
  entregamos: s.entregamos.join("\n"),
  ficaComCliente: s.ficaComCliente.join("\n"),
  ancoraValor: s.ancoraValor,
  situacao: s.situacao,
});

/** O que vai para o servidor: as listas linha a linha e as perguntas sem a marca de nova (e sem opções vazias). */
function dadosParaSalvar(c: Campos, perguntas: PerguntaEmEdicao[], roteiro: SlideDoRoteiro[] | null): DadosDoServico {
  return {
    nome: c.nome.trim(),
    sigla: c.sigla.trim(),
    resumo: c.resumo.trim(),
    dores: itensDasLinhas(c.dores),
    entregamos: itensDasLinhas(c.entregamos),
    ficaComCliente: itensDasLinhas(c.ficaComCliente),
    ancoraValor: c.ancoraValor.trim(),
    situacao: c.situacao,
    perguntas: perguntas.map(({ nova: _nova, opcoes, dica, ...p }) => ({
      ...p,
      ...(p.tipo === "opcoes" ? { opcoes: itensDasLinhas((opcoes ?? []).join("\n")) } : {}),
      ...(dica?.trim() ? { dica: dica.trim() } : {}),
    })),
    roteiro,
  };
}

/** Criar (id null) ou editar um serviço: os dados, as perguntas técnicas e o roteiro por slide. */
export default function EditarServico({ id }: { id: string | null }) {
  const navegar = useNavigate();
  const [servico, setServico] = useState<Servico | null>(null);
  const [campos, setCampos] = useState<Campos>(VAZIO);
  const [perguntas, setPerguntas] = useState<PerguntaEmEdicao[]>([]);
  const [roteiro, setRoteiro] = useState<SlideDoRoteiro[] | null>(null);
  const [carregando, setCarregando] = useState(id !== null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function mostrar(s: Servico) {
    setServico(s);
    setCampos(camposDe(s));
    setPerguntas(s.perguntas);
    setRoteiro(s.roteiro);
  }

  useEffect(() => {
    if (!id) return;
    api<Servico>(`/api/servicos/${encodeURIComponent(id)}`)
      .then(mostrar)
      .catch((e: unknown) => setErro(mensagemDe(e)))
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    document.title = `${servico?.nome ?? "Novo serviço"} · Serviços · Hub comercial MecTRIA`;
  }, [servico?.nome]);

  if (carregando) return <p className="mono suave">Abrindo o serviço…</p>;
  if (id && !servico) {
    return (
      <div className={estilos.editar}>
        <Link to="/servicos">← Serviços</Link>
        <p role="alert">{erro || "Serviço não encontrado."}</p>
      </div>
    );
  }

  const mudar = (campo: keyof Campos) => (e: { target: { value: string } }) => setCampos((c) => ({ ...c, [campo]: e.target.value }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const corpo = JSON.stringify(dadosParaSalvar(campos, perguntas, roteiro));
      const salvo = id
        ? await api<Servico>(`/api/servicos/${encodeURIComponent(id)}`, { method: "PUT", body: corpo })
        : await api<Servico>("/api/servicos", { method: "POST", body: corpo });
      avisar("Serviço salvo.");
      void recarregarServicos();
      if (id) mostrar(salvo);
      else navegar(`/servicos/${salvo.id}`, { replace: true });
    } catch (falha) {
      setErro(mensagemDe(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={estilos.editar}>
      <header className={estilos.cabeca}>
        <Link to="/servicos">← Serviços</Link>
        <h1>{servico?.nome ?? "Novo serviço"}</h1>
      </header>
      <form aria-label="Serviço" className={estilos.formulario} onSubmit={salvar} noValidate>
        <section aria-labelledby="titulo-dados" className={estilos.secao}>
          <h2 id="titulo-dados">Dados</h2>
          <div className={estilos.grade}>
            <Campo rotulo="Nome" maxLength={80} value={campos.nome} onChange={mudar("nome")} />
            <Campo rotulo="Sigla" maxLength={6} value={campos.sigla} onChange={mudar("sigla")} />
            <Selecao rotulo="Situação" opcoes={SITUACOES} value={campos.situacao} onChange={mudar("situacao")} />
          </div>
          <AreaDeTexto rotulo="Resumo" rows={2} maxLength={300} value={campos.resumo} onChange={mudar("resumo")} />
          <AreaDeTexto rotulo="Dores (uma por linha)" rows={4} value={campos.dores} onChange={mudar("dores")} />
          <AreaDeTexto rotulo="O que entregamos (um item por linha)" rows={4} value={campos.entregamos} onChange={mudar("entregamos")} />
          <AreaDeTexto rotulo="O que fica com o cliente (um item por linha)" rows={3} value={campos.ficaComCliente} onChange={mudar("ficaComCliente")} />
          <AreaDeTexto rotulo="Âncora de valor (quem faria o projeto no mercado)" rows={2} maxLength={500} value={campos.ancoraValor} onChange={mudar("ancoraValor")} />
        </section>
        <EditorDePerguntas perguntas={perguntas} sigla={campos.sigla} aoMudar={setPerguntas} />
        <EditorDoRoteiro roteiro={roteiro} aoMudar={setRoteiro} />
        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}
        <div className={estilos.rodape}>
          <Botao variante="primario" type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </Botao>
        </div>
      </form>
    </div>
  );
}
