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

/** Não existe Safra com esse identificador. */
export class SafraNaoEncontrada extends DomainError {
  readonly codigo = 'safra-nao-encontrada';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(id: string) {
    super(`Não existe Safra com o identificador ${id}.`);
  }
}

/**
 * A Safra tem Plantio registrado nela, e por isso não sai do cadastro.
 *
 * Apagá-la levaria junto o Plantio que aponta para ela, e o Plantio é registro do que
 * aconteceu na terra: ele não some porque alguém arrumou a lista de Safras.
 */
export class SafraEmUso extends DomainError {
  readonly codigo = 'safra-em-uso';
  readonly natureza: NaturezaDaFalha = 'conflito';

  constructor() {
    super(
      'Essa Safra tem pelo menos um Plantio registrado nela. ' +
        'Exclua os Plantios dela antes de tirá-la do cadastro.',
    );
  }
}
