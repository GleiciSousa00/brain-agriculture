import createClient, { type Client } from 'openapi-fetch';
import type { components, paths } from './generated/api.js';

/** O Produtor como a API o devolve, com o Documento mascarado. */
export type Produtor = components['schemas']['ProdutorDto'];

/** O corpo aceito no registro de um Produtor. */
export type CriarProdutor = components['schemas']['CriarProdutorDto'];

/** O corpo aceito na correção de um Produtor. O Documento não é editável. */
export type EditarProdutor = components['schemas']['EditarProdutorDto'];

/** A Propriedade como a API a devolve. */
export type Propriedade = components['schemas']['PropriedadeDto'];

/** O corpo aceito no registro de uma Propriedade. */
export type CriarPropriedade = components['schemas']['CriarPropriedadeDto'];

/** O corpo aceito na atualização de uma Propriedade. O Produtor dela não muda. */
export type EditarPropriedade = components['schemas']['EditarPropriedadeDto'];

/** O Plantio como a API o devolve: a ligação entre Propriedade, Cultura e Safra. */
export type Plantio = components['schemas']['PlantioDto'];

/** O corpo aceito no registro de um Plantio. */
export type RegistrarPlantio = components['schemas']['RegistrarPlantioDto'];

/** O corpo aceito ao acrescentar uma espécie ao catálogo. */
export type AcrescentarCultura = components['schemas']['AcrescentarCulturaDto'];

/** O corpo aceito no registro de uma Safra. */
export type CriarSafra = components['schemas']['CriarSafraDto'];

/** O formato único de erro da API, conforme a RFC 9457. */
export type ProblemDetails = components['schemas']['ProblemDetailsDto'];

/** Os números do painel: os dois totais e as três distribuições. */
export type Painel = components['schemas']['PainelDto'];

/** O ciclo agrícola, compartilhado por todas as Propriedades. */
export type Safra = components['schemas']['SafraDto'];

/** A espécie cultivada, como o catálogo a devolve. */
export type Cultura = components['schemas']['CulturaDto'];

/**
 * Cliente tipado da API, gerado a partir da especificação OpenAPI.
 *
 * A interface web fala com a API só por aqui. Rota, corpo e resposta vêm dos tipos
 * gerados, então uma mudança de contrato quebra na checagem de tipos e não em produção.
 */
export function createApiClient(baseUrl: string): Client<paths> {
  return createClient<paths>({ baseUrl });
}
