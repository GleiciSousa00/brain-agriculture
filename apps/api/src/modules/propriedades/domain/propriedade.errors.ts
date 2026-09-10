import { DomainError, type NaturezaDaFalha } from '../../../shared/domain/domain-error';

/** A extensão informada não serve como área. */
export class AreaInvalida extends DomainError {
  readonly codigo = 'area-invalida';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/** O nome informado para a Propriedade não serve. */
export class NomeDePropriedadeInvalido extends DomainError {
  readonly codigo = 'nome-de-propriedade-invalido';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/** A cidade informada não serve. */
export class CidadeInvalida extends DomainError {
  readonly codigo = 'cidade-invalida';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/** O estado informado não é uma unidade federativa. */
export class EstadoInvalido extends DomainError {
  readonly codigo = 'estado-invalido';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}

/**
 * A Área Agricultável somada à Área de Vegetação passa da Área Total.
 *
 * A mensagem diz a soma e a Área Total porque quem cadastra precisa saber quanto está
 * sobrando, e não só que algo está errado.
 */
export class AreasNaoFecham extends DomainError {
  readonly codigo = 'areas-nao-fecham';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';

  constructor(somaEmHectares: string, totalEmHectares: string) {
    super(
      `A soma da Área Agricultável com a Área de Vegetação é de ${somaEmHectares} ha e passa da Área Total, de ${totalEmHectares} ha.`,
    );
  }
}

/** Não existe Propriedade com esse identificador. */
export class PropriedadeNaoEncontrada extends DomainError {
  readonly codigo = 'propriedade-nao-encontrada';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(id: string) {
    super(`Não existe Propriedade com o identificador ${id}.`);
  }
}

/**
 * A Propriedade aponta para um Produtor que não existe.
 *
 * Quem descobre isso é a chave estrangeira, na gravação, e não uma consulta prévia: entre
 * conferir e gravar cabe a exclusão do Produtor, e só a restrição do banco fecha essa
 * janela.
 */
export class ProdutorDaPropriedadeNaoEncontrado extends DomainError {
  readonly codigo = 'produtor-da-propriedade-nao-encontrado';
  readonly natureza: NaturezaDaFalha = 'nao-encontrado';

  constructor(produtorId: string) {
    super(`Não existe Produtor com o identificador ${produtorId}.`);
  }
}
