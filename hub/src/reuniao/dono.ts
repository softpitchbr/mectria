import { useEffect, useState } from "react";

export type DonoDaReuniao = "verificando" | "sim" | "outra_aba";

/**
 * Só um painel por reunião neste navegador: o primeiro pega a trava "hub-reuniao-{id}" e a segura
 * enquanto estiver aberto. Os outros ficam só com o aviso (assim duas abas não se sobrescrevem).
 * Sem `navigator.locks`, o painel segue como dono.
 */
export function useDonoDaReuniao(reuniaoId: number): DonoDaReuniao {
  const temTrava = typeof navigator !== "undefined" && !!navigator.locks;
  const [dono, setDono] = useState<DonoDaReuniao>(temTrava ? "verificando" : "sim");

  useEffect(() => {
    if (!navigator.locks) return;
    let ativo = true;
    let soltar = () => {};
    const segurando = new Promise<void>((r) => (soltar = r));
    const tentar = (restantes: number) => {
      void navigator.locks.request(`hub-reuniao-${reuniaoId}`, { ifAvailable: true }, async (trava) => {
        if (!ativo) return;
        if (!trava) {
          // A trava de uma montagem anterior (por exemplo, o StrictMode em desenvolvimento) pode estar saindo agora.
          if (restantes > 0) setTimeout(() => ativo && tentar(restantes - 1), 250);
          else setDono("outra_aba");
          return;
        }
        setDono("sim");
        await segurando;
      });
    };
    tentar(2);
    return () => {
      ativo = false;
      soltar();
    };
  }, [reuniaoId]);

  return dono;
}
