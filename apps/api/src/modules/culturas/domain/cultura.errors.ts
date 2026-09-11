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

/** O catálogo não tem Cultura com esse identificador. */
export class CulturaNaoEncontrada extends DomainError {
  readonly codigo = 'cultura-nao-encontrada';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(id: string) {
    super(`Não existe Cultura com o identificador ${id}.`);
  }
}

/**
 * A Cultura está plantada em algum lugar, e por isso não sai do catálogo.
 *
 * Apagá-la levaria junto o Plantio que aponta para ela, e o Plantio é registro do que
 * aconteceu na terra: ele não some porque alguém arrumou o catálogo.
 */
export class CulturaEmUso extends DomainError {
  readonly codigo = 'cultura-em-uso';
  readonly natureza: NaturezaDaFalha = 'conflito';

  constructor() {
    super(
      'Essa Cultura está registrada em pelo menos um Plantio. ' +
        'Exclua os Plantios dela antes de tirá-la do catálogo.',
    );
  }
}
