import type {
  CriarProdutor,
  EditarProdutor,
  Produtor,
  ProdutorListado,
} from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import { PRIMEIRA_PAGINA, type Pagina } from './pagina';

/** Uma fatia de Produtores, ordenada por nome, cada um com quantas Propriedades tem. */
export async function listarProdutores(
  pagina: number,
  tamanho: number,
  busca?: string,
): Promise<Pagina<ProdutorListado>> {
  return colher(() => api.GET('/produtores', { params: { query: { pagina, tamanho, busca } } }));
}

/**
 * Os Produtores de identificador conhecido, todos numa chamada só.
 *
 * O tamanho pedido é o da própria lista, e não o padrão da rota: pedir cem identificadores
 * numa página de vinte devolveria vinte. Lista vazia é pedido de ninguém, e a chamada nem
 * sai. Ver o registro 0012.
 */
export async function buscarProdutoresPorId(ids: string[]): Promise<ProdutorListado[]> {
  if (ids.length === 0) {
    return [];
  }

  const encontrados = await colher(() =>
    api.GET('/produtores', {
      params: { query: { pagina: PRIMEIRA_PAGINA, tamanho: ids.length, ids } },
    }),
  );

  return encontrados.itens;
}

/** Registra um Produtor. O Documento pode ir com ou sem máscara. */
export async function criarProdutor(corpo: CriarProdutor): Promise<Produtor> {
  return colher(() => api.POST('/produtores', { body: corpo }));
}

/** Corrige o nome de um Produtor. O Documento não é editável. */
export async function editarProdutor(id: string, corpo: EditarProdutor): Promise<Produtor> {
  return colher(() => api.PATCH('/produtores/{id}', { params: { path: { id } }, body: corpo }));
}

/** Exclui um Produtor, e com ele suas Propriedades e seus Plantios. Ver o registro 0003. */
export async function excluirProdutor(id: string): Promise<void> {
  return colherVazio(() => api.DELETE('/produtores/{id}', { params: { path: { id } } }));
}
