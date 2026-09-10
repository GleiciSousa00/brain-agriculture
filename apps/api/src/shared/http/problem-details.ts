import { HttpException, HttpStatus } from '@nestjs/common';
import type { ProblemDetails } from '@cadastro-rural/contracts';
import { DomainError, type NaturezaDaFalha } from '../domain/domain-error';

/**
 * A tradução entre a natureza da falha, que é vocabulário de domínio, e o status HTTP,
 * que é vocabulário desta camada. É aqui que a fronteira do registro 0005 é atravessada,
 * e em nenhum outro lugar.
 */
const STATUS_POR_NATUREZA: Record<NaturezaDaFalha, number> = {
  'entrada-invalida': HttpStatus.BAD_REQUEST,
  conflito: HttpStatus.CONFLICT,
  'nao-encontrado': HttpStatus.NOT_FOUND,
};

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
  const { status, detail, codigo } = classificar(error);

  return {
    type: DEFAULT_TYPE,
    title: statusTitle(status),
    status,
    detail,
    instance,
    correlationId,
    ...(codigo === undefined ? {} : { codigo }),
  };
}

interface Classificacao {
  status: number;
  detail: string;
  codigo?: string;
}

function classificar(error: unknown): Classificacao {
  if (error instanceof DomainError) {
    return {
      status: STATUS_POR_NATUREZA[error.natureza],
      detail: error.message,
      codigo: error.codigo,
    };
  }

  if (error instanceof HttpException) {
    return { status: error.getStatus(), detail: exceptionDetail(error) };
  }

  return { status: HttpStatus.INTERNAL_SERVER_ERROR, detail: INTERNAL_FAILURE_DETAIL };
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
