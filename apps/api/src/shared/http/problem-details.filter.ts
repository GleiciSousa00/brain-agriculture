import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, type PinoLogger } from 'nestjs-pino';
import { resolveCorrelationId } from '../logging/correlation-id';
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
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { id?: unknown }>();
    const response = context.getResponse<Response>();

    const problem = toProblemDetails({
      error: exception,
      instance: request.originalUrl ?? request.url,
      // `req.id` é o identificador que o pino atribuiu. Se a falha veio antes disso,
      // `resolveCorrelationId` gera um, e a resposta ainda tem por onde ser rastreada.
      correlationId: resolveCorrelationId(request.id),
    });

    // O detalhe da resposta é genérico quando a falha é interna; o log guarda o resto.
    this.logger.error({ err: exception, problem }, 'requisição falhou');

    response.status(problem.status).type(PROBLEM_DETAILS_CONTENT_TYPE).json(problem);
  }
}
