import { useState, type FormEvent } from "react";
import { modeloDoToque, nomeDoToque, preencherModelo } from "../../../compartilhado/cadencia";
import { formatarDia } from "../../../compartilhado/datas";
import { CANAIS_DE_TOQUE, type ItemFollowup, type Toque } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import AreaDeTexto from "../../componentes/AreaDeTexto";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Selecao from "../../componentes/Selecao";
import type { Eu } from "../../sessao/useEu";
import { nomeDoServico, useServicos } from "../../servicos/servicos";
import { mensagemDe } from "./comum";
import estilos from "./followup.module.css";

function canalPadrao(canal: string): string {
  if (canal.startsWith("WhatsApp")) return "WhatsApp";
  return (CANAIS_DE_TOQUE as readonly string[]).includes(canal) ? canal : "WhatsApp";
}

/** O toque em foco: o que fazer, a mensagem pronta e o registro do que aconteceu. */
export default function ToqueEmFoco({
  item,
  eu,
  aoRegistrar,
  aoPedirResultado,
}: {
  item: ItemFollowup;
  eu: Eu;
  aoRegistrar: () => void;
  aoPedirResultado: () => void;
}) {
  const servicos = useServicos();
  const toque = item.proximo!;
  const { oportunidade, proposta } = item;
  const modelo = modeloDoToque(toque.codigo, proposta.apresentadaEm);
  const texto = preencherModelo(modelo.modelo, {
    contato: oportunidade.contato,
    servico: nomeDoServico(servicos, proposta.servico) || undefined,
    dor: proposta.dor,
    data_decisao: proposta.dataDecisao ? formatarDia(proposta.dataDecisao) : undefined,
    vendedor: eu.nome.trim().split(/\s+/)[0],
    decisores: proposta.quemDecide,
    validade: proposta.validade ? formatarDia(proposta.validade) : undefined,
  });

  const [canal, setCanal] = useState(canalPadrao(modelo.canal));
  const [resultado, setResultado] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Mensagem copiada.");
    } catch {
      avisar("Não deu para copiar. Selecione o texto e copie.");
    }
  }

  async function registrar(e: FormEvent) {
    e.preventDefault();
    if (!resultado.trim()) return setErro("Conte em uma frase como foi o toque.");
    setErro("");
    setEnviando(true);
    try {
      await api<Toque>(`/api/toques/${toque.id}`, { method: "PATCH", body: JSON.stringify({ canal, resultado: resultado.trim() }) });
      avisar("Toque registrado.");
      aoRegistrar();
    } catch (falha) {
      setErro(mensagemDe(falha));
      setEnviando(false);
    }
  }

  return (
    <div className={estilos.toque}>
      <section className={estilos.roteiro}>
        <p className={`mono ${estilos.sobre}`}>
          {nomeDoToque(toque.codigo)} · {formatarDia(toque.previstoPara)}
        </p>
        <h2>{modelo.objetivo}</h2>
        <p aria-label="Mensagem do toque" className={estilos.mensagem}>
          {texto}
        </p>
        <div className={estilos.acoes}>
          <Botao onClick={copiar}>Copiar mensagem</Botao>
        </div>
        {modelo.dica && <p className={`suave ${estilos.dica}`}>{modelo.dica}</p>}
        {item.respostasTecnicas?.length ? (
          <div className={estilos.respostas}>
            <h3>Respostas de Projetos</h3>
            <ul aria-label="Respostas de Projetos">
              {item.respostasTecnicas.map((p) => (
                <li key={p.id}>
                  <p className="suave">{p.texto}</p>
                  <p>{p.resposta}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <form aria-label="Toque feito" className={estilos.registro} onSubmit={registrar} noValidate>
        <h3>Toque feito</h3>
        <Selecao rotulo="Canal" value={canal} onChange={(e) => setCanal(e.target.value)} opcoes={CANAIS_DE_TOQUE.map((c) => ({ valor: c, rotulo: c }))} />
        <AreaDeTexto
          rotulo="Como foi"
          value={resultado}
          onChange={(e) => setResultado(e.target.value)}
          placeholder="Ex.: respondeu que decide sexta com o sócio"
          maxLength={500}
        />
        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}
        <Botao variante="primario" type="submit" disabled={enviando}>
          Registrar toque
        </Botao>
        <button type="button" className={estilos.link} onClick={aoPedirResultado}>
          Registrar resultado da proposta
        </button>
      </form>
    </div>
  );
}
