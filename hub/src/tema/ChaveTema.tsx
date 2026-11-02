import { useState } from "react";
import { aplicarTema, lerEscolhaTema, salvarEscolhaTema, type EscolhaTema } from "./tema";
import estilos from "./ChaveTema.module.css";

const OPCOES: { valor: EscolhaTema; rotulo: string }[] = [
  { valor: "sistema", rotulo: "Sistema" },
  { valor: "escuro", rotulo: "Escuro" },
  { valor: "claro", rotulo: "Claro" },
];

export default function ChaveTema() {
  const [escolha, setEscolha] = useState<EscolhaTema>(() => lerEscolhaTema());

  function escolher(valor: EscolhaTema) {
    setEscolha(valor);
    salvarEscolhaTema(valor);
    aplicarTema(valor);
  }

  return (
    <div className={estilos.chave} role="group" aria-label="Tema">
      {OPCOES.map((o) => (
        <button key={o.valor} type="button" aria-pressed={escolha === o.valor} onClick={() => escolher(o.valor)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
