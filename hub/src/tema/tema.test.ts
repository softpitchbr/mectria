import { aplicarTema, lerEscolhaTema, resolverTema, salvarEscolhaTema } from "./tema";

test("sistema segue o computador", () => {
  expect(resolverTema("sistema", true)).toBe("escuro");
  expect(resolverTema("sistema", false)).toBe("claro");
  expect(resolverTema("claro", true)).toBe("claro");
});

test("escolha inválida ou ausente vira sistema", () => {
  const s = new Map<string, string>([["hub-tema", "azul"]]);
  const falso = { getItem: (k: string) => s.get(k) ?? null, setItem: () => {} } as unknown as Storage;
  expect(lerEscolhaTema(falso)).toBe("sistema");
});

test("navegador sem localStorage não quebra", () => {
  const quebrado = {
    getItem: () => {
      throw new Error("bloqueado");
    },
    setItem: () => {
      throw new Error("bloqueado");
    },
  } as unknown as Storage;
  expect(lerEscolhaTema(quebrado)).toBe("sistema");
  expect(() => salvarEscolhaTema("escuro", quebrado)).not.toThrow();
});

test("aplicarTema escreve data-theme só quando a escolha é fixa", () => {
  const raiz = document.createElement("html");
  aplicarTema("escuro", raiz);
  expect(raiz.getAttribute("data-theme")).toBe("dark");
  aplicarTema("claro", raiz);
  expect(raiz.getAttribute("data-theme")).toBe("light");
  aplicarTema("sistema", raiz);
  expect(raiz.hasAttribute("data-theme")).toBe(false);
});

test("sem armazenamento, lembra a escolha enquanto a aba está aberta", () => {
  const quebrado = {
    getItem: () => {
      throw new Error("bloqueado");
    },
    setItem: () => {
      throw new Error("bloqueado");
    },
  } as unknown as Storage;
  salvarEscolhaTema("escuro", quebrado);
  expect(lerEscolhaTema(quebrado)).toBe("escuro");
});
