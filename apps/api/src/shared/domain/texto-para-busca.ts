/**
 * A dobra que faz "jose" encontrar "José".
 *
 * O Postgres tem a sua, declarada na migração que prepara a busca e usada tanto na
 * consulta quanto no índice. Esta é a mesma regra dita em TypeScript, para os substitutos
 * em memória recortarem como o banco recorta: um substituto que casa diferente do
 * repositório de verdade faz o teste de caso de uso provar o contrário do que acontece.
 */
export function textoParaBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** O nome contém o pedaço procurado, sem caixa nem acento a respeitar. */
export function nomeCasaComBusca(nome: string, busca?: string): boolean {
  return busca === undefined || textoParaBusca(nome).includes(textoParaBusca(busca));
}
