import { randomUUID } from 'node:crypto';

/** Cabeçalho que carrega o identificador de correlação entre serviços. */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/** Um identificador vindo de fora só é aproveitado se couber nestes limites. */
const TAMANHO_MAXIMO = 128;
const CARACTERES_ACEITOS = /^[\w.:-]+$/;

/**
 * Devolve o identificador que atravessa a requisição inteira: o que chegou, quando é
 * confiável, ou um novo. Cabeçalho é entrada de fora, então valor sem forma conhecida é
 * descartado em vez de entrar no log.
 */
export function resolveCorrelationId(recebido: string | string[] | undefined): string {
  const candidato = Array.isArray(recebido) ? recebido[0] : recebido;
  const limpo = candidato?.trim() ?? '';

  if (limpo.length > 0 && limpo.length <= TAMANHO_MAXIMO && CARACTERES_ACEITOS.test(limpo)) {
    return limpo;
  }

  return randomUUID();
}
