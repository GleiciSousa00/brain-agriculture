import { randomUUID } from 'node:crypto';

/**
 * A trinca que identifica um Plantio dentro do cadastro.
 *
 * Ela aparece duas vezes: na criação e na consulta que procura a ligação já registrada.
 * Nomeá-la evita que as duas se descolem uma da outra.
 */
export interface LigacaoDoPlantio {
  propriedadeId: string;
  culturaId: string;
  safraId: string;
}

interface DadosGravados extends LigacaoDoPlantio {
  id: string;
}

/**
 * O registro de uma Cultura em uma Propriedade em uma Safra.
 *
 * A entidade não confere se a Cultura, a Propriedade e a Safra existem, e nem poderia:
 * cada uma delas é de outro módulo, e `domain` não alcança módulo nenhum. Quem responde
 * por isso é a chave estrangeira, na gravação, e o repositório traduz a violação. Que a
 * ligação não se repita também é do banco, pela restrição de unicidade.
 *
 * A mesma Propriedade recebe vários Plantios na mesma Safra, um por Cultura, que é como se
 * representa quem planta mais de uma espécie.
 */
export class Plantio {
  private constructor(
    readonly id: string,
    readonly propriedadeId: string,
    readonly culturaId: string,
    readonly safraId: string,
  ) {}

  static criar({ propriedadeId, culturaId, safraId }: LigacaoDoPlantio): Plantio {
    return new Plantio(randomUUID(), propriedadeId, culturaId, safraId);
  }

  /** Um Plantio que já existe e está voltando da persistência. */
  static restaurar({ id, propriedadeId, culturaId, safraId }: DadosGravados): Plantio {
    return new Plantio(id, propriedadeId, culturaId, safraId);
  }
}
