import type { Repository } from 'typeorm';
import { violouChaveEstrangeira } from '../../../shared/infrastructure/postgres-errors';
import type { Propriedade } from '../domain/propriedade';
import { ProdutorDaPropriedadeNaoEncontrado } from '../domain/propriedade.errors';
import type {
  PropriedadeRepository,
  PropriedadesRecortadas,
  RecorteDePropriedades,
} from '../domain/propriedade.repository';
import { propriedadeParaDominio, propriedadeParaLinha } from './propriedade.mapper';
import { PropriedadeOrmEntity } from './propriedade.orm-entity';

export class TypeormPropriedadeRepository implements PropriedadeRepository {
  constructor(private readonly linhas: Repository<PropriedadeOrmEntity>) {}

  async save(propriedade: Propriedade): Promise<void> {
    try {
      await this.linhas.save(propriedadeParaLinha(propriedade));
    } catch (erro) {
      // A Propriedade aponta para um Produtor que não existe, ou que deixou de existir
      // entre a leitura e a gravação.
      if (violouChaveEstrangeira(erro)) {
        throw new ProdutorDaPropriedadeNaoEncontrado(propriedade.produtorId);
      }

      throw erro;
    }
  }

  async findById(id: string): Promise<Propriedade | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : propriedadeParaDominio(linha);
  }

  async delete(id: string): Promise<void> {
    await this.linhas.delete({ id });
  }

  async list({ deslocamento, limite }: RecorteDePropriedades): Promise<PropriedadesRecortadas> {
    // A contagem vem na mesma ida ao banco que a fatia, e é a do cadastro inteiro.
    const [linhas, total] = await this.linhas.findAndCount({
      order: { cidade: 'ASC', id: 'ASC' },
      skip: deslocamento,
      take: limite,
    });

    return { itens: linhas.map(propriedadeParaDominio), total };
  }
}
