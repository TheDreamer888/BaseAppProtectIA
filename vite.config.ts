import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração Vitest integrada no Vite
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,              // permite usar describe/it sem importar
    environment: "jsdom",       // simula browser para React
    setupFiles: "./src/setupTests.ts", // ficheiro para configs extra (jest-dom, mocks)
    coverage: {
      provider: "v8",           // gera relatório de cobertura
      reporter: ["text", "html"]
    }
  }
});
