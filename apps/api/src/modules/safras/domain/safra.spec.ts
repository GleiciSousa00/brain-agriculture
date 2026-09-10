import { AnoDeSafraInvalido } from './safra.errors';
import { Safra } from './safra';

describe('Safra', () => {
  it('nasce com identificador próprio e o ano informado', () => {
    const safra = Safra.criar({ ano: 2026 });

    expect(safra.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(safra.ano).toBe(2026);
  });

  it.each([[1900], [2100]])('aceita o ano %i, que está no limite', (ano) => {
    expect(() => Safra.criar({ ano })).not.toThrow();
  });

  it.each([
    ['antes do limite', 1899],
    ['depois do limite', 2101],
    ['com casa decimal', 2026.5],
    ['negativo', -2026],
  ])('recusa ano %s: %s', (_caso, ano) => {
    expect(() => Safra.criar({ ano })).toThrow(AnoDeSafraInvalido);
  });

  it('reconstrói a Safra que veio da persistência sem inventar identificador', () => {
    const safra = Safra.restaurar({ id: '0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b', ano: 2026 });

    expect(safra.id).toBe('0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b');
  });
});
