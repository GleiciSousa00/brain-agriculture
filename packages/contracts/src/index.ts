/**
 * Pacote de contratos: o cliente TypeScript gerado a partir da especificação OpenAPI
 * mora aqui. Enquanto a API não expõe rota de cadastro, o pacote publica apenas o
 * formato de erro compartilhado entre a API e a interface web.
 */

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
}
