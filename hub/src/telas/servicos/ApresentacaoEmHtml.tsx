import { useState, type ChangeEvent, type ReactNode } from "react";
import { LIMITE_DA_APRESENTACAO, type ArquivoDaApresentacao } from "../../../compartilhado/servico";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import Foco from "../../componentes/Foco";
import { recarregarServicos } from "../../servicos/servicos";
import { mensagemDe } from "../followup/comum";
import estilos from "./EditarServico.module.css";

/** O texto do arquivo escolhido (FileReader: funciona em todos os navegadores). */
function lerArquivo(arquivo: File): Promise<string> {
  return new Promise((resolver, recusar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(String(leitor.result ?? ""));
    leitor.onerror = () => recusar(new Error("Não foi possível ler o arquivo."));
    leitor.readAsText(arquivo, "utf-8");
  });
}

const tamanho = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;

/** "2026-11-11 13:05:00" (UTC, do banco) vira o dia em São Paulo: 11/11/2026. */
const diaDoEnvio = (enviadaEm: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${enviadaEm.replace(" ", "T")}Z`));

/**
 * Uma apresentação em HTML: enviar, trocar, ver e remover. Serve para a de proposta de um serviço
 * e para a da diagnóstica (igual para todos); quem usa diz os textos, o endereço e a vista.
 */
export default function ApresentacaoEmHtml<T extends { apresentacao: ArquivoDaApresentacao | null }>({
  idDoTitulo,
  titulo,
  semArquivo,
  aviso,
  caminho,
  arquivo,
  tituloDaVista,
  vista,
  aoMudar,
}: {
  idDoTitulo: string;
  titulo: string;
  semArquivo: string;
  aviso: string;
  caminho: string;
  arquivo: ArquivoDaApresentacao | null;
  tituloDaVista: string;
  vista: () => ReactNode;
  aoMudar: (salvo: T) => void;
}) {
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [vendo, setVendo] = useState<HTMLElement | null>(null);

  async function enviar(e: ChangeEvent<HTMLInputElement>) {
    const escolhido = e.target.files?.[0];
    e.target.value = "";
    if (!escolhido) return;
    setErro("");
    if (!/\.html?$/i.test(escolhido.name)) return setErro("Envie um arquivo .html.");
    if (escolhido.size > LIMITE_DA_APRESENTACAO) return setErro("A apresentação passa de 5 MB. Diminua as imagens e envie de novo.");
    setEnviando(true);
    try {
      const html = await lerArquivo(escolhido);
      const salvo = await api<T>(caminho, { method: "PUT", body: JSON.stringify({ arquivo: escolhido.name, html }) });
      aoMudar(salvo);
      avisar(`Apresentação enviada (versão ${salvo.apresentacao?.versao ?? ""}).`);
      void recarregarServicos();
    } catch (falha) {
      setErro(mensagemDe(falha));
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setErro("");
    try {
      const salvo = await api<T>(caminho, { method: "DELETE" });
      setConfirmando(false);
      aoMudar(salvo);
      avisar("Apresentação removida.");
      void recarregarServicos();
    } catch (falha) {
      setErro(mensagemDe(falha));
    }
  }

  return (
    <section aria-labelledby={idDoTitulo} className={estilos.secao}>
      <h2 id={idDoTitulo}>{titulo}</h2>
      {arquivo ? (
        <div>
          <p className="mono">
            {arquivo.arquivo} · {tamanho(arquivo.bytes)} · versão {arquivo.versao}
          </p>
          <p className="suave">
            Enviada em {diaDoEnvio(arquivo.enviadaEm)} por {arquivo.enviadaPor}
          </p>
        </div>
      ) : (
        <p>{semArquivo}</p>
      )}
      <p className="suave">
        Um arquivo .html, de até 5 MB, com tudo dentro. O modelo e as regras estão em hub/apresentacoes (exemplo.html e CONTRATO.md).
      </p>
      <div className={estilos.acoesDoItem}>
        <label className={estilos.enviarArquivo}>
          <span>{enviando ? "Enviando…" : arquivo ? "Trocar o arquivo" : "Escolher o arquivo"}</span>
          <input type="file" accept=".html,.htm,text/html" aria-label="Enviar apresentação (.html)" disabled={enviando} onChange={enviar} />
        </label>
        {arquivo && (
          <>
            <Botao onClick={(e) => setVendo(e.currentTarget)}>Ver a apresentação</Botao>
            <Botao variante="fantasma" onClick={() => setConfirmando(true)}>
              Remover apresentação
            </Botao>
          </>
        )}
      </div>
      {confirmando && (
        <div className={estilos.confirmacao} role="group" aria-label="Confirmar a remoção">
          <p>{aviso}</p>
          <div className={estilos.acoesDoItem}>
            <Botao variante="primario" onClick={remover}>
              Sim, remover
            </Botao>
            <Botao variante="fantasma" onClick={() => setConfirmando(false)}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}
      {vendo && arquivo && (
        <Foco titulo={tituloDaVista} origem={vendo} aoSair={() => setVendo(null)}>
          {vista()}
        </Foco>
      )}
    </section>
  );
}
