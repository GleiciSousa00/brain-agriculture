import { Area, AREA_MAXIMA_HECTARES } from './area';
import { AreaInvalida } from './propriedade.errors';

describe('Area', () => {
  it('guarda os hectares informados', () => {
    expect(Area.criar(1234.56).hectares).toBe(1234.56);
  });

  it('aceita zero, porque uma Propriedade pode não ter nada de vegetação', () => {
    expect(Area.criar(0).hectares).toBe(0);
  });

  it('soma sem o erro do ponto flutuante', () => {
    // 0,1 + 0,2 em ponto flutuante dá 0,30000000000000004, que passaria de 0,3 e faria a
    // regra da Propriedade recusar um cadastro correto.
    const soma = Area.criar(0.1).somar(Area.criar(0.2));

    expect(soma.hectares).toBe(0.3);
    expect(soma.maiorQue(Area.criar(0.3))).toBe(false);
  });

  it('compara pela extensão, não pela identidade do objeto', () => {
    expect(Area.criar(10).maiorQue(Area.criar(9.99))).toBe(true);
    expect(Area.criar(10).maiorQue(Area.criar(10))).toBe(false);
  });

  it('recusa área negativa', () => {
    expect(() => Area.criar(-1)).toThrow(AreaInvalida);
  });

  it('recusa o que não é número', () => {
    expect(() => Area.criar(Number.NaN)).toThrow(AreaInvalida);
    expect(() => Area.criar(Number.POSITIVE_INFINITY)).toThrow(AreaInvalida);
  });

  it('recusa mais de duas casas decimais, que a coluna não guardaria', () => {
    expect(() => Area.criar(12.345)).toThrow(AreaInvalida);
  });

  it('recusa extensão maior do que a coluna comporta', () => {
    expect(() => Area.criar(AREA_MAXIMA_HECTARES + 1)).toThrow(AreaInvalida);
  });

  it('volta da persistência sem reaplicar a política de escrita', () => {
    expect(Area.restaurar(12.345).hectares).toBe(12.35);
  });
});
