/**
 * Como os números aparecem na tela.
 *
 * A API manda número puro; a vírgula decimal e o ponto de milhar são assunto da
 * interface, e seguem o português do Brasil.
 */

const IDIOMA = 'pt-BR';

const QUANTIDADE = new Intl.NumberFormat(IDIOMA, { maximumFractionDigits: 0 });

/**
 * O cadastro guarda a área até o metro quadrado, que são quatro casas. A tela mostra
 * duas: as duas últimas não mudam nenhuma decisão de quem lê uma listagem.
 */
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

/** Área sem a unidade, para onde a unidade já está escrita ao lado. */
export function formatarArea(valor: number): string {
  return HECTARES.format(valor);
}

/**
 * Quantos, e do quê, com o substantivo concordando.
 *
 * "1 propriedade" e "3 propriedades" dizem a mesma coisa que "1 propriedade(s)" sem
 * pedir que quem lê faça a concordância de cabeça.
 */
export function formatarContagem(valor: number, singular: string, plural: string): string {
  return `${formatarQuantidade(valor)} ${valor === 1 ? singular : plural}`;
}

/** Quanto a fatia representa do total. Total zero devolve zero, e não divisão por zero. */
export function formatarParticipacao(valor: number, total: number): string {
  const fracao = total === 0 ? 0 : (valor / total) * 100;

  return `${PARTICIPACAO.format(fracao)}%`;
}

/**
 * O número que um campo de digitação entrega para a API.
 *
 * Campo vazio vira `NaN`, que o corpo leva como nulo e a API recusa com a mensagem dela.
 * Mandar zero no lugar seria a interface inventando um valor que ninguém digitou.
 */
export function comoNumero(texto: string): number {
  return texto.trim() === '' ? Number.NaN : Number(texto);
}
