// Carrega matchers extra do jest-dom
import "@testing-library/jest-dom";

// Configura mocks globais se necessário
beforeAll(() => {
  // Exemplo: mock de fetch para evitar chamadas reais
  global.fetch = async () => ({
    json: async () => [],
  }) as any;
});

// Limpa mocks entre testes
afterEach(() => {
  vi.clearAllMocks();
});
