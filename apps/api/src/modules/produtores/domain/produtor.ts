import { randomUUID } from 'node:crypto';
import type { Documento } from './documento';
import { NomeDeProdutorInvalido } from './produtor.errors';

const NOME_TAMANHO_MAXIMO = 200;

interface DadosDeCriacao {
  documento: Documento;
  nome: string;
}

interface DadosGravados extends DadosDeCriacao {
  id: string;
}

/**
 * Pessoa física ou jurídica responsável por zero ou mais Propriedades, identificada por um
 * Documento.
 */
export class Produtor {
  private constructor(
    readonly id: string,
    readonly documento: Documento,
    readonly nome: string,
  ) {}

  /** Um Produtor novo, que ainda não existe em lugar nenhum. */
  static criar({ documento, nome }: DadosDeCriacao): Produtor {
    return new Produtor(randomUUID(), documento, conferirNome(nome));
  }

  /** Um Produtor que já existe e está voltando da persistência com o identificador dele. */
  static restaurar({ id, documento, nome }: DadosGravados): Produtor {
    return new Produtor(id, documento, conferirNome(nome));
  }
}

function conferirNome(nome: string): string {
  const limpo = (nome ?? '').trim();

  if (limpo.length === 0) {
    throw new NomeDeProdutorInvalido('O nome do Produtor não pode ficar em branco.');
  }

  if (limpo.length > NOME_TAMANHO_MAXIMO) {
    throw new NomeDeProdutorInvalido(
      `O nome do Produtor passa de ${NOME_TAMANHO_MAXIMO} caracteres.`,
    );
  }

  return limpo;
}
