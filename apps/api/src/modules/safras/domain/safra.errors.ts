import { DomainError, type NaturezaDaFalha } from '../../../shared/domain/domain-error';

/** O ano informado não serve como Safra. */
export class AnoDeSafraInvalido extends DomainError {
  readonly codigo = 'ano-de-safra-invalido';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/** Já existe Safra para esse ano. */
export class SafraDuplicada extends DomainError {
  readonly codigo = 'safra-duplicada';
  readonly natureza: NaturezaDaFalha = 'conflito';

  constructor(ano: number) {
    super(`Já existe uma Safra registrada para o ano de ${ano}.`);
  }
}
