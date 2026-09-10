import type { Plantio, RegistrarPlantio } from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import type { Pagina } from './pagina';

/** Uma fatia dos Plantios de uma Propriedade. Sem nenhum, a fatia volta vazia. */
export async function listarPlantiosDaPropriedade(
  propriedadeId: string,
  pagina: number,
  tamanho: number,
): Promise<Pagina<Plantio>> {
  return colher(() =>
    api.GET('/propriedades/{propriedadeId}/plantios', {
      params: { path: { propriedadeId }, query: { pagina, tamanho } },
    }),
  );
}

/** Liga uma Cultura a uma Propriedade em uma Safra. A trinca é única. */
export async function registrarPlantio(corpo: RegistrarPlantio): Promise<Plantio> {
  return colher(() => api.POST('/plantios', { body: corpo }));
}

/** Exclui um Plantio. */
export async function excluirPlantio(id: string): Promise<void> {
  return colherVazio(() => api.DELETE('/plantios/{id}', { params: { path: { id } } }));
}
