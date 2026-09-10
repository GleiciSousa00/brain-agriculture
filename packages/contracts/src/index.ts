/**
 * Pacote de contratos.
 *
 * Os tipos das rotas saem da especificação OpenAPI da API, gerados por `pnpm gerar`, e o
 * cliente é montado sobre eles. O formato de erro é escrito à mão porque é o mesmo para
 * toda rota e não pertence a nenhuma.
 */

export { createApiClient, type CriarProdutor, type Produtor } from './client';
export type { components, operations, paths } from './generated/api';

/** Problem Details da RFC 9457, o formato único de erro da API. */
export interface ProblemDetails {
  /** URI que identifica o tipo do problema. */
  type: string;
  /** Resumo legível do tipo do problema. */
  title: string;
  /** Código de status HTTP da resposta. */
  status: number;
  /** Explicação do que aconteceu nesta ocorrência. */
  detail?: string;
  /** URI da ocorrência específica. */
  instance?: string;
  /** Identificador de correlação da requisição que falhou. */
  correlationId?: string;
  /** Código do erro de regra de negócio, quando a falha veio do domínio. */
  codigo?: string;
}
