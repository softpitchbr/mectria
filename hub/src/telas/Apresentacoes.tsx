import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ALERTA_CONSTRUCAO_DIAS, diasNaEtapa, etapaDaProposta } from "../../compartilhado/etapa";
import Tag from "../componentes/Tag";
import { diasDepois, formatarDia, formatarReais, hojeEmSaoPaulo, lerReais } from "../../compartilhado/datas";
import type { Reuniao } from "../../compartilhado/oportunidade";
import {
  faltandoNaProposta,
  montarSlides,
  slidesDaProposta,
  valoresDaProposta,
  variaveisIniciais,
  type SessaoProposta,
  type VariaveisProposta,
} from "../../compartilhado/proposta";
import { api } from "../api/cliente";
import Slide from "../apresentacao/Slide";
import AreaDeTexto from "../componentes/AreaDeTexto";
import { avisar } from "../componentes/Aviso";
import Botao from "../componentes/Botao";
import Campo from "../componentes/Campo";
import Foco from "../componentes/Foco";
import Painel from "../componentes/Painel";
import Selecao from "../componentes/Selecao";
import { opcoesDeServico, useServicos } from "../servicos/servicos";
import type { Eu } from "../sessao/useEu";
import { mensagemDe } from "./followup/comum";
import estilos from "./Apresentacoes.module.css";

const AINDA_VEM = ["Reunião diagnóstica", "Portfólio", "Uma proposta por serviço"];

/** A preparação da proposta de um cliente, em modo foco: as variáveis que a apresentação usa. */
function PrepararProposta({ reuniao, aoSalvar }: { reuniao: Reuniao; aoSalvar: () => void }) {
  const servicos = useServicos();
  const [v, setV] = useState<VariaveisProposta | null>(null);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api<SessaoProposta>(`/api/reunioes/${reuniao.id}/proposta`)
      .then((s) => {
        setV(s.variaveis);
        setValor(s.variaveis.valor ? formatarReais(s.variaveis.valor) : "");
      })
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, [reuniao.id]);

  if (!v) return erro ? <p role="alert">{erro}</p> : <p className="mono suave">Abrindo a proposta…</p>;

  const mudar = (campo: keyof VariaveisProposta) => (e: { target: { value: string } }) =>
    setV((x) => (x ? { ...x, [campo]: campo === "parcelas" ? Number(e.target.value) : e.target.value } : x));
  const falta = faltandoNaProposta({ ...v, valor: lerReais(valor) });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const centavos = valor.trim() ? lerReais(valor) : null;
    if (valor.trim() && !centavos) return setErro("Confira o valor: use o formato 12.500,00.");
    setErro("");
    setEnviando(true);
    try {
      await api(`/api/reunioes/${reuniao.id}/variaveis`, { method: "PUT", body: JSON.stringify({ ...v, valor: centavos }) });
      avisar(`Proposta de ${reuniao.empresa} salva.`);
      aoSalvar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <form className={estilos.formulario} onSubmit={salvar} noValidate>
      <p className="mono suave">
        Reunião de {formatarDia(reuniao.dataHora.slice(0, 10))} às {reuniao.dataHora.slice(11, 16)}
      </p>
      <Selecao rotulo="Serviço" value={v.servico} onChange={mudar("servico")} opcoes={opcoesDeServico(servicos, v.servico)} />
      <AreaDeTexto rotulo="Escopo incluído" rows={5} maxLength={2000} value={v.escopo} onChange={mudar("escopo")} />
      <AreaDeTexto rotulo="O que fica com o cliente" rows={4} maxLength={2000} value={v.ficaComCliente} onChange={mudar("ficaComCliente")} />
      <div className={estilos.grade}>
        <Campo rotulo="Valor" inputMode="decimal" placeholder="12.500,00" value={valor} onChange={(e) => setValor(e.target.value)} />
        <Selecao
          rotulo="Parcelas"
          value={String(v.parcelas)}
          onChange={mudar("parcelas")}
          opcoes={Array.from({ length: 12 }, (_, i) => ({ valor: String(i + 1), rotulo: `${i + 1}x` }))}
        />
        <Campo rotulo="Prazo" maxLength={500} placeholder="45 dias" value={v.prazo} onChange={mudar("prazo")} />
      </div>
      <Campo rotulo="Condições" maxLength={500} value={v.condicoes} onChange={mudar("condicoes")} />
      <Campo rotulo="Time" maxLength={500} placeholder="Nomes e papéis" value={v.equipe} onChange={mudar("equipe")} />
      <p className={falta.length ? estilos.falta : "suave"}>{falta.length ? `Falta para a reunião: ${falta.join(", ")}` : "Pronta para a reunião."}</p>
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" type="submit" disabled={enviando}>
        Salvar
      </Botao>
    </form>
  );
}

/** Docs/17, "sempre pra direita": há quantos dias a proposta está em construção, com o alerta depois de 3 dias. */
function EtapaDaProposta({ reuniao }: { reuniao: Reuniao }) {
  const etapa = etapaDaProposta({ valorPreparado: !!reuniao.valorPreparado });
  if (etapa === "ap") return <span className="suave">Proposta pronta</span>;
  const dias = diasNaEtapa(reuniao.naEtapaDesde, hojeEmSaoPaulo());
  return (
    <span className={estilos.etapa}>
      {dias === null ? "Em construção" : `Em construção há ${dias} ${dias === 1 ? "dia" : "dias"}`}
      {dias !== null && dias > ALERTA_CONSTRUCAO_DIAS && <Tag tipo="atrasado">Passou de {ALERTA_CONSTRUCAO_DIAS} dias</Tag>}
    </span>
  );
}

/** Apresentações: as propostas para preparar (variáveis de cada cliente) e o catálogo. */
export default function Apresentacoes({ eu: _eu }: { eu: Eu }) {
  const [reunioes, setReunioes] = useState<Reuniao[] | null>(null);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<{ reuniao: Reuniao; origem: HTMLElement | null } | null>(null);

  useEffect(() => {
    const hoje = hojeEmSaoPaulo();
    api<Reuniao[]>(`/api/reunioes?de=${hoje}&ate=${diasDepois(hoje, 30)}`)
      .then(setReunioes)
      .catch((e: unknown) => setErro(mensagemDe(e)));
  }, []);

  const servicos = useServicos();
  const exemplo = useMemo(() => {
    // O catálogo de exemplo usa a Climatização cadastrada; sem ela, o nome do serviço fica para completar.
    const climatizacao = servicos?.find((s) => s.id === "climatizacao") ?? null;
    const { valores, doCliente } = valoresDaProposta({
      oportunidade: { empresa: "Cliente de exemplo", contato: "", servico: "climatizacao" },
      variaveis: variaveisIniciais("climatizacao", climatizacao),
      respostas: {},
      hoje: hojeEmSaoPaulo(),
      servico: climatizacao,
    });
    return montarSlides(slidesDaProposta(), valores, doCliente);
  }, [servicos]);

  const paraPreparar = (reunioes ?? []).filter(
    (r) => r.tipo === "proposta" && (r.situacao === "marcada" || r.situacao === "em_andamento") && r.oportunidadeSituacao === "proposta_marcada",
  );

  return (
    <div className={estilos.apresentacoes}>
      <header>
        <h1>Apresentações</h1>
        <p className="suave">Prepare a proposta de cada cliente antes da reunião. É isso que a apresentação mostra.</p>
      </header>

      <section aria-labelledby="titulo-preparar" className={estilos.secao}>
        <h2 id="titulo-preparar">Propostas para preparar</h2>
        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}
        {reunioes && paraPreparar.length === 0 && <p className="suave">Nenhuma reunião de proposta nos próximos 30 dias.</p>}
        {paraPreparar.length > 0 && (
          <ul aria-label="Propostas para preparar" className={estilos.lista}>
            {paraPreparar.map((r) => (
              <li key={r.id}>
                <span className="mono">
                  {formatarDia(r.dataHora.slice(0, 10))} · {r.dataHora.slice(11, 16)}
                </span>
                <strong>{r.empresa}</strong>
                <EtapaDaProposta reuniao={r} />
                <Botao onClick={(e) => setAberta({ reuniao: r, origem: e.currentTarget.closest("li") })}>Preparar</Botao>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Catálogo" className={estilos.secao}>
        <h2>Catálogo</h2>
        <Painel className={estilos.cartao}>
          <h3>Proposta · apresentação de exemplo</h3>
          <p className="suave">13 slides, na ordem do roteiro. O que está em vermelho se completa na preparação ou é o que a MecTRIA ainda vai mandar.</p>
          <div className={estilos.miniaturas}>
            {exemplo.map((s) => (
              <Slide key={s.id} slide={s} destacarFaltas />
            ))}
          </div>
        </Painel>
        <div className={estilos.aindaVem}>
          {AINDA_VEM.map((t) => (
            <Painel key={t} className={estilos.cartao}>
              <h3>{t}</h3>
              <p className="suave">Chega com o subprojeto das apresentações.</p>
            </Painel>
          ))}
        </div>
      </section>

      {aberta && (
        <Foco titulo={`Preparar a proposta · ${aberta.reuniao.empresa}`} origem={aberta.origem} aoSair={() => setAberta(null)}>
          <PrepararProposta reuniao={aberta.reuniao} aoSalvar={() => setAberta(null)} />
        </Foco>
      )}
    </div>
  );
}
