/**
 * Como os números aparecem na tela.
 *
 * A API manda número puro; a vírgula decimal e o ponto de milhar são assunto da
 * interface, e seguem o português do Brasil.
 */

const IDIOMA = 'pt-BR';

const QUANTIDADE = new Intl.NumberFormat(IDIOMA, { maximumFractionDigits: 0 });

// Duas casas é o que a coluna de área guarda; mais do que isso seria precisão inventada.
const HECTARES = new Intl.NumberFormat(IDIOMA, { maximumFractionDigits: 2 });

const PARTICIPACAO = new Intl.NumberFormat(IDIOMA, { maximumFractionDigits: 1 });

/** Contagem inteira, como o número de Propriedades ou de Plantios. */
export function formatarQuantidade(valor: number): string {
  return QUANTIDADE.format(valor);
}

/** Área com a unidade junto, para que o número não fique órfão de medida. */
export function formatarHectares(valor: number): string {
  return `${HECTARES.format(valor)} ha`;
}

/** Quanto a fatia representa do total. Total zero devolve zero, e não divisão por zero. */
export function formatarParticipacao(valor: number, total: number): string {
  const fracao = total === 0 ? 0 : (valor / total) * 100;

  return `${PARTICIPACAO.format(fracao)}%`;
}
