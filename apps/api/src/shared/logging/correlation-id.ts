import { randomUUID } from 'node:crypto';

/** Cabeçalho que carrega o identificador de correlação entre serviços. */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/** Um identificador vindo de fora só é aproveitado se couber nestes limites. */
const MAX_LENGTH = 128;
const ACCEPTED_CHARACTERS = /^[\w.:-]+$/;

/**
 * Devolve o identificador que atravessa a requisição inteira: o que já existe, quando é
 * confiável, ou um novo.
 *
 * A entrada é `unknown` de propósito. Ela vem de cabeçalho HTTP ou do `req.id` do pino, e
 * nenhum dos dois é digno de confiança sem conferência. Valor sem forma conhecida é
 * descartado em vez de entrar no log.
 */
export function resolveCorrelationId(received: unknown): string {
  const candidate = Array.isArray(received) ? received[0] : received;
  const trimmed = typeof candidate === 'string' ? candidate.trim() : '';

  if (trimmed.length > 0 && trimmed.length <= MAX_LENGTH && ACCEPTED_CHARACTERS.test(trimmed)) {
    return trimmed;
  }

  return randomUUID();
}
