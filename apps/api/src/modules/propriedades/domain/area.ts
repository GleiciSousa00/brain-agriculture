import { AreaInvalida } from './propriedade.errors';

/**
 * A precisão da medida é o metro quadrado, que em hectare são quatro casas decimais.
 *
 * Ela é escolha de domínio, e não da coluna: cadastro rural mede terra até o metro
 * quadrado, e é essa a menor diferença que faz sentido registrar. A persistência acompanha
 * a medida, e não o contrário.
 */
const CASAS_DECIMAIS = 4;
const ESCALA = 10 ** CASAS_DECIMAIS;

/** Casas que a mensagem de erro sempre mostra, mesmo quando são zero. */
const CASAS_ESCRITAS = 2;
const ZEROS_A_ENXUGAR = new RegExp(String.raw`(\.\d{${CASAS_ESCRITAS}}\d*?)0+$`);

/**
 * Teto da extensão, em hectares.
 *
 * Não existe Propriedade maior que o país em que ela está, e o Brasil tem cerca de 851
 * milhões de hectares. Acima deste teto é erro de digitação, não terra, e o mesmo
 * argumento que limita o ano da Safra vale aqui. A coluna comporta mil vezes mais que
 * isso, de propósito: quem recusa é a regra, com mensagem, e não a gravação.
 */
export const AREA_MAXIMA_HECTARES = 1_000_000_000;

/**
 * Uma extensão de terra em hectares.
 *
 * Por dentro ela guarda metros quadrados, num inteiro. É isso que permite comparar a soma
 * da Área Agricultável com a Área de Vegetação contra a Área Total sem que 0,1 + 0,2 passe
 * de 0,3: em ponto flutuante a regra da Propriedade recusaria cadastro correto, e o defeito
 * só apareceria em alguns valores.
 */
export class Area {
  private constructor(private readonly metrosQuadrados: number) {}

  /**
   * Uma medida abaixo do metro quadrado é arredondada, não recusada.
   *
   * Recusá-la seria transformar a precisão do registro em regra de negócio, e a operadora
   * levaria um erro por uma diferença que o cadastro não distingue.
   */
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

    return new Area(Math.round(hectares * ESCALA));
  }

  /**
   * Uma área que volta da persistência.
   *
   * Ela não passa pela conferência de novo: foi conferida quando entrou, e apertar a regra
   * na leitura tornaria ilegível a linha gravada em vez de editável.
   */
  static restaurar(hectares: number): Area {
    return new Area(Math.round(hectares * ESCALA));
  }

  get hectares(): number {
    return this.metrosQuadrados / ESCALA;
  }

  somar(outra: Area): Area {
    return new Area(this.metrosQuadrados + outra.metrosQuadrados);
  }

  maiorQue(outra: Area): boolean {
    return this.metrosQuadrados > outra.metrosQuadrados;
  }

  /**
   * A extensão como a mensagem de erro a mostra, com vírgula decimal.
   *
   * Ela mostra sempre duas casas, e as duas seguintes só quando dizem algo: "60,25" é o
   * que a operadora digitou, e "60,2537" também.
   */
  escritaEmHectares(): string {
    const completo = this.hectares.toFixed(CASAS_DECIMAIS);
    const enxuto = completo.replace(ZEROS_A_ENXUGAR, '$1');

    return enxuto.replace('.', ',');
  }
}
