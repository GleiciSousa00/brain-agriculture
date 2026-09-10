import { AreaInvalida } from './propriedade.errors';

const CASAS_DECIMAIS = 2;
const ESCALA = 10 ** CASAS_DECIMAIS;

/** Margem para absorver o resíduo do próprio ponto flutuante ao escalar. */
const RESIDUO_TOLERADO = 1e-6;

/**
 * Teto da extensão, em hectares. A coluna é `numeric(14,2)`, e uma área acima disso
 * estouraria a gravação: melhor recusar no domínio, com mensagem, do que na inserção.
 */
export const AREA_MAXIMA_HECTARES = 1_000_000_000_000;

/**
 * Uma extensão de terra em hectares.
 *
 * Por dentro ela guarda centésimos de hectare, num inteiro. É isso que permite comparar a
 * soma da Área Agricultável com a Área de Vegetação contra a Área Total sem que
 * 0,1 + 0,2 passe de 0,3: em ponto flutuante a regra da Propriedade recusaria cadastro
 * correto, e o defeito só apareceria em alguns valores.
 */
export class Area {
  private constructor(private readonly centesimos: number) {}

  static criar(hectares: number): Area {
    if (typeof hectares !== 'number' || !Number.isFinite(hectares)) {
      throw new AreaInvalida('A área precisa ser um número de hectares.');
    }

    if (hectares < 0) {
      throw new AreaInvalida('A área não pode ser negativa.');
    }

    if (hectares > AREA_MAXIMA_HECTARES) {
      throw new AreaInvalida(`A área passa de ${AREA_MAXIMA_HECTARES} hectares.`);
    }

    const escalada = hectares * ESCALA;
    const centesimos = Math.round(escalada);

    if (Math.abs(escalada - centesimos) > RESIDUO_TOLERADO) {
      throw new AreaInvalida(`A área aceita no máximo ${CASAS_DECIMAIS} casas decimais.`);
    }

    return new Area(centesimos);
  }

  /**
   * Uma área que volta da persistência.
   *
   * Ela não passa pela conferência de novo: a coluna já limita o que cabe, e apertar a
   * regra na leitura tornaria ilegível a linha gravada em vez de editável.
   */
  static restaurar(hectares: number): Area {
    return new Area(Math.round(hectares * ESCALA));
  }

  get hectares(): number {
    return this.centesimos / ESCALA;
  }

  somar(outra: Area): Area {
    return new Area(this.centesimos + outra.centesimos);
  }

  maiorQue(outra: Area): boolean {
    return this.centesimos > outra.centesimos;
  }

  /** A extensão escrita como a mensagem de erro a mostra, com vírgula decimal. */
  emHectares(): string {
    return this.hectares.toFixed(CASAS_DECIMAIS).replace('.', ',');
  }
}
