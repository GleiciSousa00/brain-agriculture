import { HttpException, HttpStatus } from '@nestjs/common';
import type { ProblemDetails } from '@cadastro-rural/contracts';

/** Tipo de conteúdo da resposta de erro, conforme a RFC 9457. */
export const PROBLEM_DETAILS_CONTENT_TYPE = 'application/problem+json';

/** Sem catálogo de tipos de problema publicado, a RFC manda usar este URI. */
const TIPO_PADRAO = 'about:blank';

const DETALHE_DE_FALHA_INTERNA =
  'A requisição não pôde ser concluída. Consulte o identificador de correlação no log.';

interface EntradaDoProblema {
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
export function toProblemDetails({ error, instance, correlationId }: EntradaDoProblema): ProblemDetails {
  const status =
    error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

  return {
    type: TIPO_PADRAO,
    title: tituloDoStatus(status),
    status,
    detail: error instanceof HttpException ? detalheDaExcecao(error) : DETALHE_DE_FALHA_INTERNA,
    instance,
    correlationId,
  };
}

/** O nome do status HTTP em inglês, como manda a RFC: `Not Found`, `Bad Request`. */
function tituloDoStatus(status: number): string {
  const nome = HttpStatus[status] as string | undefined;

  return nome === undefined
    ? 'Error'
    : nome
        .toLowerCase()
        .split('_')
        .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(' ');
}

/** A mensagem da exceção, que na validação chega como lista de problemas. */
function detalheDaExcecao(error: HttpException): string {
  const resposta = error.getResponse();

  if (typeof resposta === 'string') {
    return resposta;
  }

  const mensagem = (resposta as { message?: unknown }).message;

  if (Array.isArray(mensagem)) {
    return mensagem.map(String).join('; ');
  }

  return typeof mensagem === 'string' ? mensagem : error.message;
}
