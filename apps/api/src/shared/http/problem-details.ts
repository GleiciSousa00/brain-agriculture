import { HttpException, HttpStatus } from '@nestjs/common';
import type { ProblemDetails } from '@cadastro-rural/contracts';

/** Tipo de conteúdo da resposta de erro, conforme a RFC 9457. */
export const PROBLEM_DETAILS_CONTENT_TYPE = 'application/problem+json';

/** Sem catálogo de tipos de problema publicado, a RFC manda usar este URI. */
const DEFAULT_TYPE = 'about:blank';

const INTERNAL_FAILURE_DETAIL =
  'A requisição não pôde ser concluída. Consulte o identificador de correlação no log.';

interface ProblemInput {
  /** O que foi lançado. Pode não ser sequer um erro. */
  error: unknown;
  /** A URI que sofreu a falha. */
  instance: string;
  /** O identificador que liga a resposta às linhas de log da requisição. */
  correlationId: string;
}

/**
 * Traduz qualquer coisa lançada para o formato único de erro da API.
 *
 * Erro que a aplicação não previu vira 500 com detalhe genérico: mensagem de exceção
 * interna pode carregar segredo, e o rastro fica no log, ligado pelo identificador de
 * correlação.
 */
export function toProblemDetails({ error, instance, correlationId }: ProblemInput): ProblemDetails {
  const status =
    error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

  return {
    type: DEFAULT_TYPE,
    title: statusTitle(status),
    status,
    detail: error instanceof HttpException ? exceptionDetail(error) : INTERNAL_FAILURE_DETAIL,
    instance,
    correlationId,
  };
}

/** O nome do status HTTP em inglês, como manda a RFC: `Not Found`, `Bad Request`. */
function statusTitle(status: number): string {
  const name = HttpStatus[status] as string | undefined;

  return name === undefined
    ? 'Error'
    : name
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

/** A mensagem da exceção, que na validação chega como lista de problemas. */
function exceptionDetail(error: HttpException): string {
  const response = error.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  const message = (response as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return message.map(String).join('; ');
  }

  return typeof message === 'string' ? message : error.message;
}
