import { DomainError, type NaturezaDaFalha } from '../../../shared/domain/domain-error';

/** O nome informado para o Produtor não serve. */
export class NomeDeProdutorInvalido extends DomainError {
  readonly codigo = 'nome-de-produtor-invalido';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/** Já existe um Produtor com esse Documento. */
export class ProdutorDuplicado extends DomainError {
  readonly codigo = 'produtor-duplicado';
  readonly natureza: NaturezaDaFalha = 'conflito';

  constructor() {
    super('Já existe um Produtor cadastrado com esse Documento.');
  }
}

/** Não existe Produtor com esse identificador. */
export class ProdutorNaoEncontrado extends DomainError {
  readonly codigo = 'produtor-nao-encontrado';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(id: string) {
    super(`Não existe Produtor com o identificador ${id}.`);
  }
}
