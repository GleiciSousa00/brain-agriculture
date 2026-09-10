import type { Repository } from 'typeorm';
import {
  restricaoViolada,
  violouChaveEstrangeira,
  violouUnicidade,
} from '../../../shared/infrastructure/postgres-errors';
import type { LigacaoDoPlantio, Plantio } from '../domain/plantio';
import {
  CulturaDoPlantioNaoEncontrada,
  PlantioDuplicado,
  PropriedadeDoPlantioNaoEncontrada,
  SafraDoPlantioNaoEncontrada,
} from '../domain/plantio.errors';
import type { Recortados } from '../../../shared/domain/recorte';
import type { PlantioRepository, RecorteDePlantios } from '../domain/plantio.repository';
import { plantioParaDominio, plantioParaLinha } from './plantio.mapper';
import { PlantioOrmEntity } from './plantio.orm-entity';

export class TypeormPlantioRepository implements PlantioRepository {
  constructor(private readonly linhas: Repository<PlantioOrmEntity>) {}

  async save(plantio: Plantio): Promise<void> {
    try {
      await this.linhas.insert(plantioParaLinha(plantio));
    } catch (erro) {
      throw this.traduzir(erro, plantio);
    }
  }

  async findById(id: string): Promise<Plantio | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : plantioParaDominio(linha);
  }

  async findByLigacao(ligacao: LigacaoDoPlantio): Promise<Plantio | null> {
    const linha = await this.linhas.findOneBy(ligacao);

    return linha === null ? null : plantioParaDominio(linha);
  }

  async delete(id: string): Promise<void> {
    await this.linhas.delete({ id });
  }

  async listByPropriedade({
    propriedadeId,
    deslocamento,
    limite,
  }: RecorteDePlantios): Promise<Recortados<Plantio>> {
    const [linhas, total] = await this.linhas.findAndCount({
      where: { propriedadeId },
      order: { criadoEm: 'ASC', id: 'ASC' },
      skip: deslocamento,
      take: limite,
    });

    return { itens: linhas.map(plantioParaDominio), total };
  }

  /**
   * Traduz a violação do banco para o erro do módulo.
   *
   * As três chaves estrangeiras dão a mesma violação, e é o nome da restrição que diz qual
   * das três referências não existe. Sem o nome, a resposta seria genérica, e quem cadastra
   * não saberia qual dos três campos corrigir.
   */
  private traduzir(erro: unknown, plantio: Plantio): unknown {
    if (violouUnicidade(erro)) {
      return new PlantioDuplicado();
    }

    if (!violouChaveEstrangeira(erro)) {
      return erro;
    }

    switch (restricaoViolada(erro)) {
      case 'fk_plantios_cultura':
        return new CulturaDoPlantioNaoEncontrada(plantio.culturaId);
      case 'fk_plantios_safra':
        return new SafraDoPlantioNaoEncontrada(plantio.safraId);
      case 'fk_plantios_propriedade':
        return new PropriedadeDoPlantioNaoEncontrada(plantio.propriedadeId);
      default:
        return erro;
    }
  }
}
