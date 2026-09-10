/**
 * Pacote de contratos.
 *
 * Tudo aqui sai da especificação OpenAPI da API, gerada por `pnpm openapi` na raiz. Nada é
 * escrito à mão: rota, corpo, resposta e formato de erro vêm dos esquemas que a própria API
 * publica, então uma mudança de contrato quebra na checagem de tipos e não em produção.
 */

export { createApiClient, type CriarProdutor, type Produtor } from './client';
export type { components, operations, paths } from './generated/api';
export type { ProblemDetails } from './client';
