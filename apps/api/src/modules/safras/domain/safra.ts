import { randomUUID } from 'node:crypto';
import { AnoDeSafraInvalido } from './safra.errors';

/**
 * Limites do ano. Não existe safra agrícola registrada fora desta faixa, e um número fora
 * dela é erro de digitação, não ciclo.
 */
export const ANO_MINIMO = 1900;
export const ANO_MAXIMO = 2100;

interface DadosDeCriacao {
  ano: number;
}

interface DadosGravados extends DadosDeCriacao {
  id: string;
}

/**
 * O ciclo agrícola identificado por um ano.
 *
 * A Safra é compartilhada por todas as Propriedades e não pertence a nenhuma: ela não
 * guarda referência a Propriedade nem a Produtor, e é o Plantio que liga os três.
 */
export class Safra {
  private constructor(
    readonly id: string,
    readonly ano: number,
  ) {}

  static criar({ ano }: DadosDeCriacao): Safra {
    return new Safra(randomUUID(), conferirAno(ano));
  }

  static restaurar({ id, ano }: DadosGravados): Safra {
    return new Safra(id, conferirAno(ano));
  }
}

function conferirAno(ano: number): number {
  if (!Number.isInteger(ano)) {
    throw new AnoDeSafraInvalido('O ano da Safra precisa ser um número inteiro.');
  }

  if (ano < ANO_MINIMO || ano > ANO_MAXIMO) {
    throw new AnoDeSafraInvalido(
      `O ano da Safra precisa estar entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`,
    );
  }

  return ano;
}
