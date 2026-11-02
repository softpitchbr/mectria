import { render, screen } from "@testing-library/react";
import App from "./App";

test("mostra o nome do hub", () => {
  render(<App />);
  expect(screen.getByText("Hub comercial MecTRIA")).toBeInTheDocument();
});
