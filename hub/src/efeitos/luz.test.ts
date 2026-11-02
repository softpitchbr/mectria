import { renderHook } from "@testing-library/react";
import { useLuzDoCursor } from "./luz";

function falsoMatchMedia(casa: (consulta: string) => boolean) {
  window.matchMedia = ((consulta: string) => ({
    matches: casa(consulta),
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  document.documentElement.style.removeProperty("--cx");
  document.documentElement.style.removeProperty("--cy");
});

afterEach(() => {
  vi.useRealTimers();
});

function moverPara(x: number, y: number) {
  window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y }));
}

test("no celular (pointer: coarse) a luz não acompanha o dedo", () => {
  falsoMatchMedia((c) => c === "(pointer: coarse)");
  renderHook(() => useLuzDoCursor());
  moverPara(100, 200);
  vi.advanceTimersToNextFrame();
  expect(document.documentElement.style.getPropertyValue("--cx")).toBe("");
});

test("com movimento reduzido a luz fica parada", () => {
  falsoMatchMedia((c) => c === "(prefers-reduced-motion: reduce)");
  renderHook(() => useLuzDoCursor());
  moverPara(100, 200);
  vi.advanceTimersToNextFrame();
  expect(document.documentElement.style.getPropertyValue("--cx")).toBe("");
});

test("no notebook a luz grava a posição no próximo frame", () => {
  falsoMatchMedia(() => false);
  renderHook(() => useLuzDoCursor());
  moverPara(100, 200);
  expect(document.documentElement.style.getPropertyValue("--cx")).toBe("");
  vi.advanceTimersToNextFrame();
  expect(document.documentElement.style.getPropertyValue("--cx")).toBe("100px");
  expect(document.documentElement.style.getPropertyValue("--cy")).toBe("200px");
});

test("ao desmontar, para de ouvir o cursor", () => {
  falsoMatchMedia(() => false);
  const { unmount } = renderHook(() => useLuzDoCursor());
  unmount();
  moverPara(50, 60);
  vi.advanceTimersToNextFrame();
  expect(document.documentElement.style.getPropertyValue("--cx")).toBe("");
});
