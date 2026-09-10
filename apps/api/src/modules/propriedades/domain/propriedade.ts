import { randomUUID } from 'node:crypto';
import type { Area } from './area';
import { AreasNaoFecham, CidadeInvalida, EstadoInvalido } from './propriedade.errors';

export const CIDADE_TAMANHO_MAXIMO = 120;

/** As vinte e sete unidades federativas. O painel agrupa por esta coluna. */
export const UNIDADES_FEDERATIVAS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

export type UnidadeFederativa = (typeof UNIDADES_FEDERATIVAS)[number];

interface Localizacao {
  cidade: string;
  estado: string;
}

interface Areas {
  areaTotal: Area;
  areaAgricultavel: Area;
  areaDeVegetacao: Area;
}

interface DadosDeCriacao extends Localizacao, Areas {
  produtorId: string;
}

interface DadosGravados extends Omit<DadosDeCriacao, 'estado'> {
  id: string;
  /** Texto, e não a sigla conferida: o que vem da coluna ainda não passou por regra. */
  estado: string;
}

/**
 * A unidade de terra registrada em nome de um Produtor.
 *
 * A regra da soma vive aqui, e não no esquema de entrada, porque ela é a razão de a
 * Propriedade existir como entidade: um cadastro cujas áreas não fecham não é um formulário
 * mal preenchido, é uma Propriedade que não pode existir. Ver o registro 0007.
 */
export class Propriedade {
  private constructor(
    readonly id: string,
    readonly produtorId: string,
    readonly cidade: string,
    readonly estado: UnidadeFederativa,
    readonly areaTotal: Area,
    readonly areaAgricultavel: Area,
    readonly areaDeVegetacao: Area,
  ) {}

  static criar(dados: DadosDeCriacao): Propriedade {
    conferirAreas(dados);

    return new Propriedade(
      randomUUID(),
      dados.produtorId,
      conferirCidade(dados.cidade),
      conferirEstado(dados.estado),
      dados.areaTotal,
      dados.areaAgricultavel,
      dados.areaDeVegetacao,
    );
  }

  /**
   * Uma Propriedade que já existe e está voltando da persistência.
   *
   * Nada passa pela conferência de novo. Se a regra da soma apertasse depois, uma linha
   * gravada sob a regra antiga deixaria de poder ser lida, e portanto de poder ser
   * corrigida, que é exatamente o contrário do que se quer.
   */
  static restaurar(dados: DadosGravados): Propriedade {
    return new Propriedade(
      dados.id,
      dados.produtorId,
      dados.cidade,
      // A conversão é a política do 'restaurar': a sigla foi conferida quando entrou, e
      // conferi-la de novo tornaria ilegível a linha gravada em vez de editável.
      dados.estado as UnidadeFederativa,
      dados.areaTotal,
      dados.areaAgricultavel,
      dados.areaDeVegetacao,
    );
  }

  /** A mesma Propriedade com localização e áreas novas, com a regra da soma conferida de novo. */
  editar(dados: Localizacao & Areas): Propriedade {
    conferirAreas(dados);

    return new Propriedade(
      this.id,
      this.produtorId,
      conferirCidade(dados.cidade),
      conferirEstado(dados.estado),
      dados.areaTotal,
      dados.areaAgricultavel,
      dados.areaDeVegetacao,
    );
  }
}

function conferirAreas({ areaTotal, areaAgricultavel, areaDeVegetacao }: Areas): void {
  const soma = areaAgricultavel.somar(areaDeVegetacao);

  if (soma.maiorQue(areaTotal)) {
    throw new AreasNaoFecham(soma.escritaEmHectares(), areaTotal.escritaEmHectares());
  }
}

function conferirCidade(cidade: string): string {
  const limpa = (cidade ?? '').trim();

  if (limpa.length === 0) {
    throw new CidadeInvalida('A cidade da Propriedade não pode ficar em branco.');
  }

  if (limpa.length > CIDADE_TAMANHO_MAXIMO) {
    throw new CidadeInvalida(`A cidade da Propriedade passa de ${CIDADE_TAMANHO_MAXIMO} caracteres.`);
  }

  return limpa;
}

function conferirEstado(estado: string): UnidadeFederativa {
  const sigla = (estado ?? '').trim().toUpperCase();

  if (!(UNIDADES_FEDERATIVAS as readonly string[]).includes(sigla)) {
    throw new EstadoInvalido(`"${estado}" não é a sigla de uma unidade federativa.`);
  }

  return sigla as UnidadeFederativa;
}
