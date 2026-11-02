import "@testing-library/jest-dom/vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
