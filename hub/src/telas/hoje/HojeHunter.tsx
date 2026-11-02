import { useCallback, useEffect, useState } from "react";
import { formatarDia } from "../../../compartilhado/datas";
import type { ContagemLigacoes, Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import Botao from "../../componentes/Botao";
import Foco from "../../componentes/Foco";
import Medidor from "../../componentes/Medidor";
import NumeroRolante from "../../componentes/NumeroRolante";
import Painel from "../../componentes/Painel";
import type { Eu } from "../../sessao/useEu";
import { ChecklistDaRotina, useRotinaDeHoje } from "../Rotinas";
import BlocoDeLigacoes from "./BlocoDeLigacoes";
import estilos from "./hoje.module.css";

/** Hoje do hunter: bloco de ligações (em foco), diagnósticas marcadas e a rotina. */
export default function HojeHunter({ eu }: { eu: Eu }) {
  const [contagem, setContagem] = useState<ContagemLigacoes | null>(null);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [origem, setOrigem] = useState<HTMLElement | null>(null);
  const [emFoco, setEmFoco] = useState(false);
  const rotina = useRotinaDeHoje();

  const carregarReunioes = useCallback(() => {
    api<Reuniao[]>("/api/reunioes")
      .then(setReunioes)
      .catch(() => setReunioes([]));
  }, []);

  useEffect(() => {
    api<ContagemLigacoes>("/api/ligacoes")
      .then(setContagem)
      .catch(() => setContagem({ total: 0, naoAtendeu: 0, atendeu: 0, marcou: 0, meta: 2 }));
    carregarReunioes();
  }, [carregarReunioes]);

  return (
    <div className={estilos.colunas}>
      <Painel className={estilos.cartaoPrincipal}>
        <p className={`mono ${estilos.sobre}`}>BLOCO DE LIGAÇÕES</p>
        {contagem && (
          <>
            <p className={estilos.total}>
              <NumeroRolante valor={contagem.total} /> <span className="suave">de {contagem.meta} ligações hoje</span>
            </p>
            <Medidor rotulo="Meta do dia" valor={contagem.total} total={contagem.meta} texto={`${contagem.total}/${contagem.meta}`} />
            <p className="suave">{contagem.naoAtendeu} sem resposta para o WhatsApp</p>
          </>
        )}
        <Botao
          variante="primario"
          onClick={(e) => {
            setOrigem(e.currentTarget.closest("div") as HTMLElement);
            setEmFoco(true);
          }}
        >
          Começar o bloco
        </Botao>
      </Painel>

      <Painel>
        <h2 className={estilos.subtitulo}>Diagnósticas que marquei</h2>
        {reunioes.length === 0 ? (
          <p className="suave">Nenhuma diagnóstica nos próximos 7 dias.</p>
        ) : (
          <ul className={estilos.lista} aria-label="Diagnósticas que marquei">
            {reunioes.map((r) => (
              <li key={r.id}>
                <span className="mono">
                  {formatarDia(r.dataHora.slice(0, 10))} · {r.dataHora.slice(11, 16)}
                </span>
                <span>{r.empresa}</span>
                <span className="suave">{r.closerNome ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      {rotina.dia && (
        <Painel className={estilos.largo}>
          <h2 className={estilos.subtitulo}>
            Rotina de hoje{" "}
            <span className="mono suave">
              {rotina.dia.feitos}/{rotina.dia.total}
            </span>
          </h2>
          <ChecklistDaRotina dia={rotina.dia} aoMarcar={rotina.marcar} />
        </Painel>
      )}

      {emFoco && contagem && (
        <Foco
          titulo="Bloco de ligações"
          origem={origem}
          aoSair={() => {
            setEmFoco(false);
            carregarReunioes();
            rotina.recarregar();
          }}
        >
          <BlocoDeLigacoes eu={eu} inicial={contagem} aoMudar={setContagem} />
        </Foco>
      )}
    </div>
  );
}
