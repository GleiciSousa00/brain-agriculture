import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * A dobra que faz "jose" encontrar "José", declarada na migração que prepara a busca.
 *
 * Ela é aplicada dos dois lados da comparação, e é a mesma que indexa a coluna: escrever
 * a comparação de outro jeito aqui faria o índice deixar de ser usado, calado.
 */
const DOBRA = 'texto_para_busca';

/**
 * Recorta a consulta pelo pedaço de nome procurado.
 *
 * O termo entra como parâmetro, e nunca concatenado: é o que separa uma busca de uma
 * injeção. Sem termo a consulta volta como estava, porque campo em branco não é recorte.
 */
export function recortarPorNome<T extends ObjectLiteral>(
  consulta: SelectQueryBuilder<T>,
  coluna: string,
  busca?: string,
): SelectQueryBuilder<T> {
  if (busca === undefined) {
    return consulta;
  }

  return consulta.andWhere(`${DOBRA}(${coluna}) LIKE ${DOBRA}(:termo)`, { termo: `%${busca}%` });
}
