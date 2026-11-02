import { useEffect, useState } from "react";
import type { Cargo } from "../../compartilhado/cargos";
import { api, ErroApi } from "../api/cliente";

export type Eu = { id: number; nome: string; email: string; cargo: Cargo };

export type EstadoEu =
  | { estado: "carregando" }
  | { estado: "ok"; eu: Eu }
  | { estado: "sem_acesso" }
  | { estado: "erro"; mensagem: string };

/** Quem está usando o hub. Vira sem_acesso se qualquer chamada da API disser isso. */
export function useEu(): EstadoEu {
  const [estado, setEstado] = useState<EstadoEu>({ estado: "carregando" });

  useEffect(() => {
    let vivo = true;
    const aoPerderAcesso = () => setEstado({ estado: "sem_acesso" });
    window.addEventListener("hub:sem-acesso", aoPerderAcesso);

    api<Eu>("/api/eu")
      .then((eu) => vivo && setEstado({ estado: "ok", eu }))
      .catch((e: unknown) => {
        if (!vivo) return;
        if (e instanceof ErroApi && e.codigo === "sem_acesso") setEstado({ estado: "sem_acesso" });
        else setEstado({ estado: "erro", mensagem: e instanceof ErroApi ? e.mensagem : "Algo deu errado ao abrir o hub." });
      });

    return () => {
      vivo = false;
      window.removeEventListener("hub:sem-acesso", aoPerderAcesso);
    };
  }, []);

  return estado;
}
