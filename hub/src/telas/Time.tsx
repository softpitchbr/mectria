import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import AbaMes from "./time/AbaMes";
import { CARGOS, ROTULO_CARGO, type Cargo } from "../../compartilhado/cargos";
import type { Pessoa } from "../../compartilhado/pessoa";
import { api, ErroApi } from "../api/cliente";
import { avisar } from "../componentes/Aviso";
import Botao from "../componentes/Botao";
import Campo from "../componentes/Campo";
import Painel from "../componentes/Painel";
import Tag from "../componentes/Tag";
import type { Eu } from "../sessao/useEu";
import estilos from "./Time.module.css";

const mensagemDe = (e: unknown) => (e instanceof ErroApi ? e.mensagem : "Algo deu errado. Tente de novo.");

function SeletorDeCargo(props: { id?: string; rotulo: string; valor: Cargo; aoMudar: (c: Cargo) => void; desligado?: boolean }) {
  return (
    <select
      id={props.id}
      aria-label={props.id ? undefined : props.rotulo}
      className={estilos.seletor}
      value={props.valor}
      disabled={props.desligado}
      onChange={(e) => props.aoMudar(e.target.value as Cargo)}
    >
      {CARGOS.map((c) => (
        <option key={c} value={c}>
          {ROTULO_CARGO[c]}
        </option>
      ))}
    </select>
  );
}

/** Nome da pessoa com "Renomear": Enter salva, Esc desiste. */
function NomeEditavel({ pessoa, aoSalvar }: { pessoa: Pessoa; aoSalvar: (nome: string) => Promise<boolean> }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(pessoa.nome);

  async function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setEditando(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nome = rascunho.trim();
      if (!nome || nome === pessoa.nome) return setEditando(false);
      if (await aoSalvar(nome)) setEditando(false);
    }
  }

  if (editando) {
    return (
      <input
        className={estilos.renomear}
        aria-label={`Novo nome de ${pessoa.nome}`}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onKeyDown={aoTeclar}
        onBlur={() => setEditando(false)}
        autoFocus
      />
    );
  }
  return (
    <>
      <span className={estilos.nome}>{pessoa.nome}</span>
      <button
        type="button"
        className={estilos.lapis}
        aria-label={`Renomear ${pessoa.nome}`}
        title="Renomear"
        onClick={() => {
          setRascunho(pessoa.nome);
          setEditando(true);
        }}
      >
        Renomear
      </button>
    </>
  );
}

function FormularioNovaPessoa({ aoCriar }: { aoCriar: (p: Pessoa) => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState<Cargo>("hunter");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const pessoa = await api<Pessoa>("/api/pessoas", { method: "POST", body: JSON.stringify({ nome, email, cargo }) });
      aoCriar(pessoa);
      setNome("");
      setEmail("");
      setCargo("hunter");
    } catch (falha) {
      setErro(mensagemDe(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Painel>
      <form aria-label="Adicionar pessoa" className={estilos.formulario} onSubmit={enviar} noValidate>
        <h2>Adicionar pessoa</h2>
        <div className={estilos.campos}>
          <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
          <Campo rotulo="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@mectria.com" autoComplete="off" />
          <div className={estilos.campoCargo}>
            <label htmlFor="novo-cargo">Cargo</label>
            <SeletorDeCargo id="novo-cargo" rotulo="Cargo" valor={cargo} aoMudar={setCargo} />
          </div>
          <Botao variante="primario" type="submit" disabled={enviando}>
            Adicionar
          </Botao>
        </div>
        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}
      </form>
    </Painel>
  );
}

/** Time: o diretor cadastra pessoas, troca cargos e desativa quem saiu. */
export default function Time({ eu }: { eu: Eu }) {
  const [aba, setAba] = useState<"pessoas" | "mes">("pessoas");
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null);
  const [erroLista, setErroLista] = useState("");

  useEffect(() => {
    api<Pessoa[]>("/api/pessoas")
      .then(setPessoas)
      .catch((e: unknown) => setErroLista(mensagemDe(e)));
  }, []);

  async function mudar(pessoa: Pessoa, mudancas: Partial<Pick<Pessoa, "nome" | "cargo" | "ativo">>, aviso: string) {
    setErroLista("");
    try {
      const nova = await api<Pessoa>(`/api/pessoas/${pessoa.id}`, { method: "PATCH", body: JSON.stringify(mudancas) });
      setPessoas((lista) => lista?.map((p) => (p.id === nova.id ? nova : p)) ?? null);
      avisar(aviso);
      // Quem mudou o próprio cargo passa a ver outras seções.
      if (nova.id === eu.id && nova.cargo !== eu.cargo) window.location.assign("/");
      return true;
    } catch (e) {
      setErroLista(mensagemDe(e));
      return false;
    }
  }

  const ativas = pessoas?.filter((p) => p.ativo).length ?? 0;

  return (
    <div className={estilos.time}>
      <header className={estilos.cabeca}>
        <p className="mono suave">TIME · {ativas} ATIVAS</p>
        <h1>Time comercial</h1>
        <p className="suave">Quem entra no hub e o que cada cargo vê. Ninguém é apagado: quem sai fica inativo.</p>
      </header>

      <div role="tablist" aria-label="Seções do time" className={estilos.abas}>
        {(
          [
            ["pessoas", "Pessoas"],
            ["mes", "Mês"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`aba-${id}`}
            aria-selected={aba === id}
            aria-controls={`painel-${id}`}
            className={estilos.aba}
            onClick={() => setAba(id)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "mes" && (
        <div role="tabpanel" id="painel-mes" aria-labelledby="aba-mes">
          <AbaMes />
        </div>
      )}

      {aba === "pessoas" && (
        <div role="tabpanel" id="painel-pessoas" aria-labelledby="aba-pessoas" className={estilos.time}>
          <FormularioNovaPessoa
            aoCriar={(nova) => {
              setPessoas((lista) => [...(lista ?? []), nova]);
              avisar(`${nova.nome.split(" ")[0]} entrou no time.`);
            }}
          />

          {erroLista && (
            <p role="alert" className={estilos.erro}>
              {erroLista}
            </p>
          )}

          {pessoas === null && !erroLista && <p className="mono suave">Carregando o time…</p>}

          {pessoas && (
            <ul className={estilos.lista} aria-label="Pessoas do time">
              {pessoas.map((p) => (
                <li key={p.id} className={p.ativo ? estilos.linha : `${estilos.linha} ${estilos.inativa}`}>
                  <div className={estilos.quem}>
                    <NomeEditavel pessoa={p} aoSalvar={(nome) => mudar(p, { nome }, `Nome trocado para ${nome}.`)} />
                    {p.id === eu.id && <Tag>Você</Tag>}
                    <span className={`mono suave ${estilos.email}`}>{p.email}</span>
                  </div>
                  <SeletorDeCargo
                    rotulo={`Cargo de ${p.nome}`}
                    valor={p.cargo}
                    aoMudar={(cargo) => mudar(p, { cargo }, `${p.nome.split(" ")[0]} agora é ${ROTULO_CARGO[cargo]}.`)}
                  />
                  <Tag tipo={p.ativo ? "hoje" : "neutro"} className={estilos.estado}>
                    {p.ativo ? "Ativa" : "Inativa"}
                  </Tag>
                  <div className={estilos.acao}>
                    {p.id !== eu.id &&
                      (p.ativo ? (
                        <Botao
                          variante="fantasma"
                          aria-label={`Desativar ${p.nome}`}
                          onClick={() => mudar(p, { ativo: false }, `${p.nome.split(" ")[0]} foi desativada.`)}
                        >
                          Desativar
                        </Botao>
                      ) : (
                        <Botao aria-label={`Reativar ${p.nome}`} onClick={() => mudar(p, { ativo: true }, `${p.nome.split(" ")[0]} voltou ao time.`)}>
                          Reativar
                        </Botao>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
