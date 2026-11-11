import "@testing-library/jest-dom/vitest";
import { esquecerServicos } from "../servicos/servicos";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  esquecerServicos();
});
