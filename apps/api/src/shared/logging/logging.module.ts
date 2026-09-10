import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { CORRELATION_ID_HEADER, resolveCorrelationId } from './correlation-id';
import { DOCUMENTO_REDACTION_PATHS, REDACTION_CENSOR } from './redaction';

/** Rota chamada pelo orquestrador o tempo todo, que não interessa no log. */
const ROTA_DE_SAUDE = '/health';

/**
 * Log em JSON com identificador de correlação por requisição.
 *
 * O identificador entra no `req.id` do pino, sai em toda linha de log daquela requisição
 * e volta ao cliente no cabeçalho de resposta, para que o rastro atravesse a fronteira.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId(req: IncomingMessage, res: ServerResponse): string {
          const correlationId = resolveCorrelationId(req.headers[CORRELATION_ID_HEADER]);
          res.setHeader(CORRELATION_ID_HEADER, correlationId);
          return correlationId;
        },
        redact: {
          paths: DOCUMENTO_REDACTION_PATHS,
          censor: REDACTION_CENSOR,
        },
        autoLogging: {
          ignore: (req: IncomingMessage) => req.url === ROTA_DE_SAUDE,
        },
      },
    }),
  ],
})
export class LoggingModule {}
