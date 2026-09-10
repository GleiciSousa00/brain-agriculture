import { DomainError, type NaturezaDaFalha } from '../../../shared/domain/domain-error';

/** O nome informado não serve como Cultura. */
export class NomeDeCulturaInvalido extends DomainError {
  readonly codigo = 'nome-de-cultura-invalido';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/** O catálogo já tem essa Cultura. */
export class CulturaDuplicada extends DomainError {
  readonly codigo = 'cultura-duplicada';
  readonly natureza: NaturezaDaFalha = 'conflito';

  constructor(nome: string) {
    super(`O catálogo já tem a Cultura ${nome}.`);
  }
}
