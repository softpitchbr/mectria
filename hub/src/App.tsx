import { Avisos } from "./componentes/Aviso";
import { useLuzDoCursor } from "./efeitos/luz";
import Vitrine from "./telas/Vitrine";

export default function App() {
  useLuzDoCursor();
  const naVitrine = import.meta.env.DEV && window.location.pathname === "/vitrine";
  return (
    <>
      {naVitrine ? <Vitrine /> : <h1>Hub comercial MecTRIA</h1>}
      <Avisos />
    </>
  );
}
