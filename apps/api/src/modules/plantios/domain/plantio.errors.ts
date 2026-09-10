import { DomainError, type NaturezaDaFalha } from '../../../shared/domain/domain-error';

/**
 * A Propriedade já tem essa Cultura registrada nessa Safra.
 *
 * O que se recusa é a ligação repetida, e não a segunda Cultura na mesma Safra: essa é
 * justamente o caso normal de quem planta mais de uma espécie.
 */
export class PlantioDuplicado extends DomainError {
  readonly codigo = 'plantio-duplicado';
  readonly natureza: NaturezaDaFalha = 'conflito';

  constructor() {
    super('Essa Propriedade já tem essa Cultura registrada nessa Safra.');
  }
}

/** Não existe Plantio com esse identificador. */
export class PlantioNaoEncontrado extends DomainError {
  readonly codigo = 'plantio-nao-encontrado';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(id: string) {
    super(`Não existe Plantio com o identificador ${id}.`);
  }
}

/**
 * O Plantio aponta para uma Propriedade que não existe.
 *
 * Quem descobre isso é a chave estrangeira, na gravação, e não uma consulta prévia: entre
 * conferir e gravar cabe a exclusão da Propriedade, e só a restrição do banco fecha essa
 * janela.
 */
export class PropriedadeDoPlantioNaoEncontrada extends DomainError {
  readonly codigo = 'propriedade-do-plantio-nao-encontrada';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(propriedadeId: string) {
    super(`Não existe Propriedade com o identificador ${propriedadeId}.`);
  }
}

/** O Plantio aponta para uma Cultura que não está no catálogo. */
export class CulturaDoPlantioNaoEncontrada extends DomainError {
  readonly codigo = 'cultura-do-plantio-nao-encontrada';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(culturaId: string) {
    super(`Não existe Cultura com o identificador ${culturaId}.`);
  }
}

/** O Plantio aponta para uma Safra que não existe. */
export class SafraDoPlantioNaoEncontrada extends DomainError {
  readonly codigo = 'safra-do-plantio-nao-encontrada';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(safraId: string) {
    super(`Não existe Safra com o identificador ${safraId}.`);
  }
}
