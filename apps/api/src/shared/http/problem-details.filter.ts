import { randomUUID } from 'node:crypto';
import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, type PinoLogger } from 'nestjs-pino';
import { PROBLEM_DETAILS_CONTENT_TYPE, toProblemDetails } from './problem-details';

/**
 * Filtro global de erro: toda falha sai no formato Problem Details da RFC 9457.
 *
 * Sem `@Catch(...)` nenhum, ele pega tudo, inclusive o que não é `HttpException`. Assim a
 * consumidora da API escreve um tratamento só.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(ProblemDetailsFilter.name) private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const requisicao = contexto.getRequest<Request>();
    const resposta = contexto.getResponse<Response>();

    const problema = toProblemDetails({
      error: exception,
      instance: requisicao.originalUrl ?? requisicao.url,
      correlationId: identificadorDaRequisicao(requisicao),
    });

    // O detalhe da resposta é genérico quando a falha é interna; o log guarda o resto.
    this.logger.error({ err: exception, problema }, 'requisição falhou');

    resposta
      .status(problema.status)
      .type(PROBLEM_DETAILS_CONTENT_TYPE)
      .json(problema);
  }
}

/** O `req.id` que o pino atribuiu, ou um novo se a falha veio antes disso. */
function identificadorDaRequisicao(requisicao: Request): string {
  const id: unknown = (requisicao as Request & { id?: unknown }).id;

  return typeof id === 'string' ? id : randomUUID();
}
