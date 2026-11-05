import { useState } from "react";
import { preencherModelo } from "../../../compartilhado/cadencia";
import { horaDoFup } from "../../../compartilhado/confirmacao";
import { FUPS_CONFIRMACAO, GRUPO_CONFIRMACAO, MENSAGEM_GRUPO_CONFIRMADA } from "../../../compartilhado/dados/confirmacao";
import { formatarDia } from "../../../compartilhado/datas";
import type { Reuniao } from "../../../compartilhado/oportunidade";
import { api } from "../../api/cliente";
import { avisar } from "../../componentes/Aviso";
import Botao from "../../componentes/Botao";
import type { Eu } from "../../sessao/useEu";
import { mensagemDe } from "../followup/comum";
import { primeiroNome } from "./comum";
import estilos from "./hoje.module.css";

async function copiar(texto: string, aviso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    avisar(aviso);
  } catch {
    avisar("Não deu para copiar. Selecione o texto e copie.");
  }
}

/** A confirmação da diagnóstica no dia (docs/17, seção 3): FUP 1, 2 e 3, cada um só depois do anterior, e o "Confirmada". */
export default function ConfirmacaoDaDiagnostica({ reuniao, eu, aoMudar }: { reuniao: Reuniao; eu: Eu; aoMudar: (r: Reuniao) => void }) {
  const [enviando, setEnviando] = useState(false);
  const feitos = reuniao.fupsConfirmacao ?? 0;
  const valores = {
    hunter: primeiroNome(eu.nome),
    data: formatarDia(reuniao.dataHora.slice(0, 10)),
    hora: reuniao.dataHora.slice(11, 16),
    empresa: reuniao.empresa,
    contato: reuniao.contato,
    formato: reuniao.formato === "online" ? "online" : "presencial",
  };

  async function registrar(corpo: { fup: number } | { confirmada: true }): Promise<boolean> {
    setEnviando(true);
    try {
      aoMudar(await api<Reuniao>(`/api/reunioes/${reuniao.id}/confirmacao`, { method: "POST", body: JSON.stringify(corpo) }));
      return true;
    } catch (e) {
      avisar(mensagemDe(e));
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function mandarFup(numero: number, modelo: string) {
    await copiar(preencherModelo(modelo, valores), `FUP ${numero} copiado. Mande pelo WhatsApp.`);
    await registrar({ fup: numero });
  }

  async function confirmar() {
    if (await registrar({ confirmada: true })) {
      await copiar(preencherModelo(MENSAGEM_GRUPO_CONFIRMADA, valores), `Aviso copiado. Mande no ${GRUPO_CONFIRMACAO}.`);
    }
  }

  return (
    <div role="group" aria-label={`Confirmação de ${reuniao.empresa}`} className={estilos.confirmacao}>
      {reuniao.confirmadaEm ? (
        <>
          <span className={estilos.confirmada}>✓ Confirmada pelo cliente</span>
          <Botao variante="fantasma" onClick={() => copiar(preencherModelo(MENSAGEM_GRUPO_CONFIRMADA, valores), "Aviso copiado.")}>
            Copiar o aviso do grupo
          </Botao>
        </>
      ) : (
        <>
          {FUPS_CONFIRMACAO.map((f) => (
            <Botao
              key={f.numero}
              variante="fantasma"
              title={f.quando}
              disabled={enviando || f.numero > feitos + 1}
              aria-label={`FUP ${f.numero}: ${f.quando}${f.numero <= feitos ? " (enviado)" : ""}`}
              onClick={() => mandarFup(f.numero, f.modelo)}
            >
              FUP {f.numero} · {horaDoFup(f.numero, valores.hora) ?? "início do dia"}
              {f.numero <= feitos ? " ✓" : ""}
            </Botao>
          ))}
          <Botao disabled={enviando} onClick={confirmar}>
            Confirmada
          </Botao>
        </>
      )}
    </div>
  );
}
