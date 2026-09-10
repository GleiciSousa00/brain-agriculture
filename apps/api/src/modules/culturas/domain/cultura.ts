import { randomUUID } from 'node:crypto';
import { NomeDeCulturaInvalido } from './cultura.errors';

export const NOME_TAMANHO_MAXIMO = 100;
const ESPACOS_REPETIDOS = /\s+/g;
const SINAIS_DIACRITICOS = /\p{Diacritic}/gu;

interface DadosDeCriacao {
  nome: string;
}

interface DadosGravados extends DadosDeCriacao {
  id: string;
  chave: string;
}

/**
 * A espécie cultivada, que vive num catálogo e não como texto livre digitado a cada
 * cadastro.
 *
 * Além do nome como a operadora digitou, a Cultura carrega uma chave de comparação, que é
 * o nome sem acento, sem caixa e sem espaço sobrando. É ela que responde se duas entradas
 * são a mesma espécie, e é sobre ela que a unicidade do catálogo é declarada. Sem isso
 * "Café", "cafe" e "CAFÉ" viram três linhas.
 */
export class Cultura {
  private constructor(
    readonly id: string,
    readonly nome: string,
    readonly chave: string,
  ) {}

  static criar({ nome }: DadosDeCriacao): Cultura {
    const limpo = conferirNome(nome);

    return new Cultura(randomUUID(), limpo, chaveDe(limpo));
  }

  /**
   * Uma Cultura que já existe e está voltando da persistência.
   *
   * O nome não passa pela conferência de novo, e a chave vem gravada em vez de ser
   * recalculada: ela é a identidade da linha no catálogo, e recalcular faria a linha mudar
   * de identidade em silêncio se a regra mudasse.
   */
  static restaurar({ id, nome, chave }: DadosGravados): Cultura {
    return new Cultura(id, nome, chave);
  }
}

/** A forma que responde se dois nomes são a mesma espécie. */
export function chaveDe(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(SINAIS_DIACRITICOS, '')
    .toLowerCase()
    .trim()
    .replace(ESPACOS_REPETIDOS, ' ');
}

function conferirNome(nome: string): string {
  const limpo = nome.trim().replace(ESPACOS_REPETIDOS, ' ');

  if (limpo.length === 0) {
    throw new NomeDeCulturaInvalido('O nome da Cultura não pode ficar em branco.');
  }

  if (limpo.length > NOME_TAMANHO_MAXIMO) {
    throw new NomeDeCulturaInvalido(
      `O nome da Cultura passa de ${NOME_TAMANHO_MAXIMO} caracteres.`,
    );
  }

  return limpo;
}
