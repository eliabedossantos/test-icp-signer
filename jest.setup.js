// Configuração de setup para testes
require('dotenv').config({ path: '.env.test' });

// Mock do console para evitar logs durante os testes
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}; 