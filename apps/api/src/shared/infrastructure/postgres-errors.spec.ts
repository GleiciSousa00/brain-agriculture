import { QueryFailedError } from 'typeorm';
import { violouChaveEstrangeira, violouUnicidade } from './postgres-errors';

function falhaComCodigo(code: string): QueryFailedError {
  const doDriver = Object.assign(new Error('falhou'), { code });

  return new QueryFailedError('INSERT', [], doDriver);
}

describe('violouUnicidade', () => {
  it('reconhece a violação de unicidade', () => {
    expect(violouUnicidade(falhaComCodigo('23505'))).toBe(true);
  });

  it('não confunde com outra violação de restrição', () => {
    expect(violouUnicidade(falhaComCodigo('23503'))).toBe(false);
  });

  it('não confunde com erro que não é do banco', () => {
    expect(violouUnicidade(new Error('qualquer coisa'))).toBe(false);
  });
});

describe('violouChaveEstrangeira', () => {
  it('reconhece a violação de chave estrangeira', () => {
    expect(violouChaveEstrangeira(falhaComCodigo('23503'))).toBe(true);
  });

  it('não confunde com a violação de unicidade', () => {
    expect(violouChaveEstrangeira(falhaComCodigo('23505'))).toBe(false);
  });

  it('não confunde com erro que não é do banco', () => {
    expect(violouChaveEstrangeira(new Error('qualquer coisa'))).toBe(false);
  });
});
