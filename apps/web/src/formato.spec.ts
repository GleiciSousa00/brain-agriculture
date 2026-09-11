import { describe, expect, it } from 'vitest';
import { formatarHectares, formatarQuantidade, formatarParticipacao } from './formato';

describe('formatarQuantidade', () => {
  it('separa o milhar como se escreve em português', () => {
    expect(formatarQuantidade(1234)).toBe('1.234');
  });

  it('mostra o zero', () => {
    expect(formatarQuantidade(0)).toBe('0');
  });
});

describe('formatarHectares', () => {
  it('escreve a unidade junto do número', () => {
    expect(formatarHectares(1234.5)).toBe('1.234,5 ha');
  });

  it('não mostra casa decimal quando não há', () => {
    expect(formatarHectares(40)).toBe('40 ha');
  });

  it('arredonda a exibição em duas casas, ainda que o cadastro guarde quatro', () => {
    expect(formatarHectares(1.239)).toBe('1,24 ha');
  });
});

describe('formatarParticipacao', () => {
  it('dá a fatia sobre o total', () => {
    expect(formatarParticipacao(1, 4)).toBe('25%');
  });

  it('arredonda para uma casa quando a divisão não é exata', () => {
    expect(formatarParticipacao(1, 3)).toBe('33,3%');
  });

  it('devolve zero quando o total é zero, em vez de dividir por ele', () => {
    expect(formatarParticipacao(0, 0)).toBe('0%');
  });
});
