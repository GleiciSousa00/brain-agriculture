import type { CriarProdutor, EditarProdutor, Produtor } from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import type { Fatia } from './pagina';

/** Uma fatia de Produtores, ordenada por nome. */
export async function listarProdutores(pagina: number, tamanho: number): Promise<Fatia<Produtor>> {
  return colher(() => api.GET('/produtores', { params: { query: { pagina, tamanho } } }));
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
