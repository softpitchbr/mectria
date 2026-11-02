import { Link } from "react-router";
import Painel from "../componentes/Painel";
import Marca from "./Marca";
import estilos from "./SemAcesso.module.css";

/**
 * Sem `secao`: o e-mail não tem acesso ao hub (tela inteira).
 * Com `secao`: a pessoa entrou, mas a seção não faz parte do cargo dela.
 */
export default function SemAcesso({ secao }: { secao?: string }) {
  if (secao) {
    return (
      <Painel className={estilos.secao}>
        <p className="mono suave">ACESSO</p>
        <p>Seu acesso não inclui {secao}. Fale com o diretor comercial da MecTRIA.</p>
        <Link to="/">Voltar para o Hoje</Link>
      </Painel>
    );
  }
  return (
    <main className={estilos.tela}>
      <Painel className={estilos.cartao}>
        <Marca />
        <h1>Hub comercial MecTRIA</h1>
        <p>Seu e-mail não tem acesso ao hub. Fale com o diretor comercial da MecTRIA.</p>
        <a href="/cdn-cgi/access/logout">Entrar com outro e-mail</a>
      </Painel>
    </main>
  );
}
