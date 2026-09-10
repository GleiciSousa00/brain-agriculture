import type { Repository } from 'typeorm';
import type { PropriedadesPorEstado } from '../../painel/domain/painel';
import type {
  PropriedadesDoPainelRepository,
  ResumoDasPropriedades,
} from '../../painel/domain/propriedades-do-painel.repository';
import { Area } from '../domain/area';
import type { UnidadeFederativa } from '../domain/propriedade';
import { PropriedadeOrmEntity } from './propriedade.orm-entity';

/** O que o banco devolve. Contagem e soma vêm como texto, e é aqui que viram medida. */
interface LinhaDoResumo {
  propriedades: string;
  areaTotal: string;
  areaAgricultavel: string;
  areaDeVegetacao: string;
}

interface LinhaPorEstado {
  estado: string;
  propriedades: string;
}

/**
 * A implementação da porta que o módulo de painel declara.
 *
 * Ela mora aqui porque quem sabe consultar a tabela de Propriedade é o módulo de
 * Propriedade. Quem liga uma coisa à outra é o arquivo de módulo. Ver o registro 0005.
 *
 * As duas consultas agregam no banco e devolvem só as linhas do resultado. Nenhuma delas
 * carrega Propriedade. Ver o registro 0004.
 */
export class TypeormPropriedadesDoPainelRepository implements PropriedadesDoPainelRepository {
  constructor(private readonly linhas: Repository<PropriedadeOrmEntity>) {}

  /**
   * A soma volta do banco como texto e vira medida aqui.
   *
   * A Área guarda metros quadrados num inteiro justamente para a soma não acumular resíduo,
   * e este é o único ponto em que uma soma já feita pelo banco entra por fora. Ela cabe: o
   * teto da Área é um bilhão de hectares, e mesmo o cadastro inteiro nesse teto fica três
   * ordens de grandeza abaixo do maior inteiro exato de um número em JavaScript.
   */
  async resumir(): Promise<ResumoDasPropriedades> {
    const linha = await this.linhas
      .createQueryBuilder('propriedade')
      .select('COUNT(*)', 'propriedades')
      .addSelect('COALESCE(SUM(propriedade.areaTotal), 0)', 'areaTotal')
      .addSelect('COALESCE(SUM(propriedade.areaAgricultavel), 0)', 'areaAgricultavel')
      .addSelect('COALESCE(SUM(propriedade.areaDeVegetacao), 0)', 'areaDeVegetacao')
      .getRawOne<LinhaDoResumo>();

    const {
      propriedades = '0',
      areaTotal = '0',
      areaAgricultavel = '0',
      areaDeVegetacao = '0',
    } = linha ?? {};

    return {
      propriedades: Number(propriedades),
      areaTotal: Area.restaurar(Number(areaTotal)),
      areaAgricultavel: Area.restaurar(Number(areaAgricultavel)),
      areaDeVegetacao: Area.restaurar(Number(areaDeVegetacao)),
    };
  }

  async contarPorEstado(): Promise<PropriedadesPorEstado[]> {
    const linhas = await this.linhas
      .createQueryBuilder('propriedade')
      .select('propriedade.estado', 'estado')
      .addSelect('COUNT(*)', 'propriedades')
      .groupBy('propriedade.estado')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('propriedade.estado', 'ASC')
      .getRawMany<LinhaPorEstado>();

    return linhas.map((linha) => ({
      estado: linha.estado as UnidadeFederativa,
      propriedades: Number(linha.propriedades),
    }));
  }
}
