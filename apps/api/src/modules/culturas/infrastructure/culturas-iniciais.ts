import { chaveDe } from '../domain/cultura';

/**
 * A carga inicial do catálogo: as espécies mais comuns na produção brasileira.
 *
 * O catálogo é editável, então esta lista é ponto de partida e não limite. Ela vive aqui,
 * em TypeScript, e não solta dentro do SQL, para que a migração e a chave de comparação do
 * domínio não possam divergir.
 */
export const CULTURAS_INICIAIS = [
  'Soja',
  'Milho',
  'Café',
  'Cana-de-açúcar',
  'Algodão',
  'Arroz',
  'Feijão',
  'Trigo',
  'Laranja',
  'Sorgo',
];

/** As linhas da carga inicial, com a chave calculada pela regra do domínio. */
export function linhasIniciais(): { nome: string; chave: string }[] {
  return CULTURAS_INICIAIS.map((nome) => ({ nome, chave: chaveDe(nome) }));
}
