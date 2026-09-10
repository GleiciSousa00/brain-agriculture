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

  it('guarda a medida até o metro quadrado, que são quatro casas decimais', () => {
    expect(Area.criar(12.3456).hectares).toBe(12.3456);
  });

  it('arredonda abaixo do metro quadrado em vez de recusar', () => {
    expect(Area.criar(12.34567).hectares).toBe(12.3457);
  });

  it('recusa extensão maior que o teto, porque acima dele é digitação e não terra', () => {
    expect(() => Area.criar(AREA_MAXIMA_HECTARES + 1)).toThrow(AreaInvalida);
  });

  it('aceita o teto exato, que a coluna comporta com folga', () => {
    expect(Area.criar(AREA_MAXIMA_HECTARES).hectares).toBe(AREA_MAXIMA_HECTARES);
  });

  it('escreve a extensão com vírgula, sem casas que não dizem nada', () => {
    expect(Area.criar(60.25).escritaEmHectares()).toBe('60,25');
    expect(Area.criar(100).escritaEmHectares()).toBe('100,00');
    expect(Area.criar(12.3456).escritaEmHectares()).toBe('12,3456');
  });

  it('volta da persistência sem reaplicar a política de escrita', () => {
    expect(Area.restaurar(12.3456).hectares).toBe(12.3456);
  });
});
