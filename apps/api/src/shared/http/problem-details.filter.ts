import {
  Catch,
  HttpStatus,
  MethodNotAllowedException,
  NotFoundException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, type PinoLogger } from 'nestjs-pino';
import { resolveCorrelationId } from '../logging/correlation-id';
import { PROBLEM_DETAILS_CONTENT_TYPE, toProblemDetails } from './problem-details';
import { RotasDaApi } from './rotas-da-api';

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
    private readonly rotas: RotasDaApi,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { id?: unknown }>();
    const response = context.getResponse<Response>();

    const permitidos = this.metodosPermitidos(exception, request);
    const falha = permitidos.length === 0 ? exception : recusaDeMetodo(request, permitidos);

    const problem = toProblemDetails({
      error: falha,
      instance: request.originalUrl ?? request.url,
      correlationId: resolveCorrelationId(request.id),
    });

    const registrar =
      problem.status < HttpStatus.INTERNAL_SERVER_ERROR
        ? this.logger.warn.bind(this.logger)
        : this.logger.error.bind(this.logger);

    registrar({ err: exception, problem }, 'requisição falhou');

    if (permitidos.length > 0) {
      response.setHeader('Allow', permitidos.join(', '));
    }

    response.status(problem.status).type(PROBLEM_DETAILS_CONTENT_TYPE).json(problem);
  }

  /**
   * Os métodos que o caminho pedido aceita, quando o que faltou foi o método.
   *
   * O Nest devolve 404 tanto para caminho inexistente quanto para método não registrado,
   * e só a tabela de rotas separa os dois. Vazio quer dizer que o 404 fica como está.
   */
  private metodosPermitidos(exception: unknown, request: Request): string[] {
    if (!(exception instanceof NotFoundException)) {
      return [];
    }

    const permitidos = this.rotas.metodosPara(request.path);

    return permitidos.includes(request.method) ? [] : permitidos;
  }
}

function recusaDeMetodo(request: Request, permitidos: string[]): MethodNotAllowedException {
  return new MethodNotAllowedException(
    `O caminho ${request.path} não aceita ${request.method}. Aceita: ${permitidos.join(', ')}.`,
  );
}
