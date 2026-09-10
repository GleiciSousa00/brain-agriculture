import type { CriarPropriedade, EditarPropriedade, Propriedade } from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import type { Fatia } from './pagina';

/** Uma fatia de Propriedades, ordenada por nome. */
export async function listarPropriedades(
  pagina: number,
  tamanho: number,
): Promise<Fatia<Propriedade>> {
  return colher(() => api.GET('/propriedades', { params: { query: { pagina, tamanho } } }));
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
