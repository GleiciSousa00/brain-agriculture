import type { CriarPropriedade, EditarPropriedade, Propriedade } from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import type { Pagina } from './pagina';

/** Uma fatia de Propriedades, ordenada por nome. */
export async function listarPropriedades(
  pagina: number,
  tamanho: number,
): Promise<Pagina<Propriedade>> {
  return colher(() => api.GET('/propriedades', { params: { query: { pagina, tamanho } } }));
}

/**
 * Uma fatia das Propriedades de um Produtor.
 *
 * Quem recorta é a rota do Produtor: a listagem geral não aceita filtro, e recortar do
 * lado de cá só recortaria a página que já veio. O `produtorId` volta para as linhas
 * porque a rota, sendo a dele, não repete de quem cada Propriedade é.
 */
export async function listarPropriedadesDoProdutor(
  produtorId: string,
  pagina: number,
  tamanho: number,
): Promise<Pagina<Propriedade>> {
  const produtor = await colher(() =>
    api.GET('/produtores/{id}', {
      params: { path: { id: produtorId }, query: { pagina, tamanho } },
    }),
  );

  return {
    ...produtor.propriedades,
    itens: produtor.propriedades.itens.map((propriedade) => ({ ...propriedade, produtorId })),
  };
}

/** Registra uma Propriedade em nome de um Produtor. */
export async function criarPropriedade(corpo: CriarPropriedade): Promise<Propriedade> {
  return colher(() => api.POST('/propriedades', { body: corpo }));
}

/** Atualiza o nome, a localização e as áreas. O Produtor da Propriedade não muda. */
export async function editarPropriedade(
  id: string,
  corpo: EditarPropriedade,
): Promise<Propriedade> {
  return colher(() => api.PUT('/propriedades/{id}', { params: { path: { id } }, body: corpo }));
}

/** Exclui uma Propriedade, e com ela seus Plantios. */
export async function excluirPropriedade(id: string): Promise<void> {
  return colherVazio(() => api.DELETE('/propriedades/{id}', { params: { path: { id } } }));
}
