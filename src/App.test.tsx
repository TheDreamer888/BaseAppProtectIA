import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("App CRUD de Utilizadores", () => {
  test("renderiza título principal", () => {
    render(<App />);
    expect(screen.getByText(/Utilizadores/i)).toBeInTheDocument();
  });

  test("renderiza inputs e botão Guardar", () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Guardar/i)).toBeInTheDocument();
  });

  test("permite adicionar novo utilizador", async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/Nome/i), {
      target: { value: "David" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: "david@example.com" },
    });
    fireEvent.click(screen.getByText(/Guardar/i));

    expect(await screen.findByText(/David/i)).toBeInTheDocument();
    expect(await screen.findByText(/david@example.com/i)).toBeInTheDocument();
  });

  test("não adiciona utilizador se campos estiverem vazios", () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Guardar/i));
    expect(screen.getByRole("list")).toBeEmptyDOMElement();
  });
});
