import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { CORRELATION_ID_HEADER, resolveCorrelationId } from './correlation-id';
import { DOCUMENTO_REDACTION_PATHS, REDACTION_CENSOR } from './redaction';

/**
 * Log em JSON com identificador de correlação por requisição.
 *
 * O identificador entra no `req.id` do pino, sai em toda linha de log daquela requisição
 * e volta ao cliente no cabeçalho de resposta, para que o rastro atravesse a fronteira.
 * Nenhuma rota é dispensada do log, nem a de saúde.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId(request: IncomingMessage, response: ServerResponse): string {
          const correlationId = resolveCorrelationId(request.headers[CORRELATION_ID_HEADER]);
          response.setHeader(CORRELATION_ID_HEADER, correlationId);
          return correlationId;
        },
        redact: {
          paths: DOCUMENTO_REDACTION_PATHS,
          censor: REDACTION_CENSOR,
        },
      },
    }),
  ],
})
export class LoggingModule {}
