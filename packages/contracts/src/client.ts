import createClient, { type Client } from 'openapi-fetch';
import type { components, paths } from './generated/api';

/** O Produtor como a API o devolve, com o Documento mascarado. */
export type Produtor = components['schemas']['ProdutorDto'];

/** O corpo aceito no registro de um Produtor. */
export type CriarProdutor = components['schemas']['CriarProdutorDto'];

/**
 * Cliente tipado da API, gerado a partir da especificação OpenAPI.
 *
 * A interface web fala com a API só por aqui. Rota, corpo e resposta vêm dos tipos
 * gerados, então uma mudança de contrato quebra na checagem de tipos e não em produção.
 */
export function createApiClient(baseUrl: string): Client<paths> {
  return createClient<paths>({ baseUrl });
}
