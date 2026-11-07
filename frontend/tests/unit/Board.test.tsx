import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Board } from "@/components/Board";

describe("Board UI - Pruebas Unitarias de Componentes", () => {
  it("renderiza el encabezado y las 5 columnas fijas con sus datos iniciales", () => {
    render(<Board />);

    expect(
      screen.getByText("Gestor de Proyectos Kanban")
    ).toBeInTheDocument();

    expect(screen.getByTestId("column-title-col-1")).toHaveTextContent("Backlog");
    expect(screen.getByTestId("column-title-col-2")).toHaveTextContent("Por Hacer");
    expect(screen.getByTestId("column-title-col-3")).toHaveTextContent("En Progreso");
    expect(screen.getByTestId("column-title-col-4")).toHaveTextContent("En Revisión");
    expect(screen.getByTestId("column-title-col-5")).toHaveTextContent("Completado");
  });

  it("permite renombrar una columna desde la interfaz", () => {
    render(<Board />);

    const editBtn = screen.getByTestId("edit-column-col-1");
    fireEvent.click(editBtn);

    const input = screen.getByTestId("column-input-col-1");
    fireEvent.change(input, { target: { value: "Pendientes" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByTestId("column-title-col-1")).toHaveTextContent("Pendientes");
  });

  it("muestra error si se intenta crear una tarjeta sin título y permite crearla con datos válidos", () => {
    render(<Board />);

    fireEvent.click(screen.getByTestId("add-card-btn-col-1"));
    expect(screen.getByTestId("new-card-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("submit-card-btn"));
    expect(screen.getByTestId("title-error-msg")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("new-card-title-input"), {
      target: { value: "Tarjeta desde Test" },
    });
    fireEvent.change(screen.getByTestId("new-card-details-input"), {
      target: { value: "Detalle desde Test" },
    });
    fireEvent.click(screen.getByTestId("submit-card-btn"));

    expect(screen.getByText("Tarjeta desde Test")).toBeInTheDocument();
    expect(screen.getByText("Detalle desde Test")).toBeInTheDocument();
  });

  it("permite eliminar una tarjeta existente al hacer clic en el botón de eliminar", () => {
    render(<Board />);

    expect(
      screen.getByText("Definir arquitectura de microservicios")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-card-card-1"));

    expect(
      screen.queryByText("Definir arquitectura de microservicios")
    ).not.toBeInTheDocument();
  });

  it("permite editar el título y detalles de una tarjeta existente", () => {
    render(<Board />);

    fireEvent.click(screen.getByTestId("edit-card-card-1"));
    expect(screen.getByTestId("edit-card-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("edit-card-title-input"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByTestId("submit-edit-card-btn"));
    expect(screen.getByTestId("title-error-msg")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("edit-card-title-input"), {
      target: { value: "Título editado en test" },
    });
    fireEvent.change(screen.getByTestId("edit-card-details-input"), {
      target: { value: "Detalles editados en test" },
    });
    fireEvent.click(screen.getByTestId("submit-edit-card-btn"));

    expect(screen.getByText("Título editado en test")).toBeInTheDocument();
    expect(screen.getByText("Detalles editados en test")).toBeInTheDocument();
  });
});
