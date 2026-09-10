/**
 * Pacote de contratos.
 *
 * Tudo aqui sai da especificação OpenAPI da API, gerada por `pnpm openapi` na raiz. Nada é
 * escrito à mão: rota, corpo, resposta e formato de erro vêm dos esquemas que a própria API
 * publica, então uma mudança de contrato quebra na checagem de tipos e não em produção.
 */

export {
  type AcrescentarCultura,
  createApiClient,
  type CriarProdutor,
  type CriarPropriedade,
  type CriarSafra,
  type Cultura,
  type EditarProdutor,
  type EditarPropriedade,
  type Painel,
  type Plantio,
  type ProblemDetails,
  type Produtor,
  type Propriedade,
  type RegistrarPlantio,
  type Safra,
} from './client.js';
export type { components, operations, paths } from './generated/api.js';
