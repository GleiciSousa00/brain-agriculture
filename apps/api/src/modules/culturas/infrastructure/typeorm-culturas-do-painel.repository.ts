import { In, type Repository } from 'typeorm';
import type { CulturasDoPainelRepository } from '../../painel/domain/culturas-do-painel.repository';
import { CulturaOrmEntity } from './cultura.orm-entity';

/**
 * A implementação da porta que o módulo de painel declara.
 *
 * A consulta é por chave primária, sobre no máximo tantos identificadores quanto o catálogo
 * tem espécies. Ela não agrega nada: quem agrega é o módulo de Plantio, no banco.
 */
export class TypeormCulturasDoPainelRepository implements CulturasDoPainelRepository {
  constructor(private readonly linhas: Repository<CulturaOrmEntity>) {}

  async nomesPorId(ids: string[]): Promise<Map<string, string>> {
    // Sem identificador nenhum não há o que perguntar, e um `IN` vazio não é SQL válido.
    if (ids.length === 0) {
      return new Map();
    }

    const encontradas = await this.linhas.find({
      where: { id: In(ids) },
      select: { id: true, nome: true },
    });

    return new Map(encontradas.map((linha) => [linha.id, linha.nome]));
  }
}
