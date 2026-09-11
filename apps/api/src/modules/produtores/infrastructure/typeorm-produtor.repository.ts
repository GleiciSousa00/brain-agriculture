import type { Repository } from 'typeorm';
import type { RecorteComBusca, Recortados } from '../../../shared/domain/recorte';
import { recortarPorNome } from '../../../shared/infrastructure/busca-por-nome';
import { violouUnicidade } from '../../../shared/infrastructure/postgres-errors';
import type { Documento } from '../domain/documento';
import type { Produtor } from '../domain/produtor';
import { ProdutorDuplicado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';
import type { ProdutorMapper } from './produtor.mapper';
import { ProdutorOrmEntity } from './produtor.orm-entity';

export class TypeormProdutorRepository implements ProdutorRepository {
  constructor(
    private readonly linhas: Repository<ProdutorOrmEntity>,
    private readonly mapper: ProdutorMapper,
  ) {}

  async save(produtor: Produtor): Promise<void> {
    try {
      await this.linhas.insert(this.mapper.paraLinha(produtor));
    } catch (erro) {
      if (violouUnicidade(erro)) {
        throw new ProdutorDuplicado();
      }

      throw erro;
    }
  }

  /**
   * Só o nome vai para o banco.
   *
   * As duas colunas derivadas do Documento ficam como estão porque o Documento não é
   * editável, e reescrevê-las trocaria o texto cifrado sem trocar o dado, gastando
   * gravação à toa.
   */
  async update(produtor: Produtor): Promise<void> {
    await this.linhas.update({ id: produtor.id }, { nome: produtor.nome });
  }

  /** Exclusão física, conforme o registro 0003. As Propriedades vão junto pela cascata. */
  async delete(id: string): Promise<void> {
    await this.linhas.delete({ id });
  }

  async findById(id: string): Promise<Produtor | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : this.mapper.paraDominio(linha);
  }

  async findByDocumento(documento: Documento): Promise<Produtor | null> {
    const linha = await this.linhas.findOneBy({
      documentoImpressao: this.mapper.impressaoDe(documento),
    });

    return linha === null ? null : this.mapper.paraDominio(linha);
  }

  async list({ deslocamento, limite, busca }: RecorteComBusca): Promise<Recortados<Produtor>> {
    const [linhas, total] = await recortarPorNome(
      this.linhas.createQueryBuilder('produtor'),
      'produtor.nome',
      busca,
    )
      .orderBy('produtor.nome', 'ASC')
      .addOrderBy('produtor.id', 'ASC')
      .skip(deslocamento)
      .take(limite)
      .getManyAndCount();

    return { itens: linhas.map((linha) => this.mapper.paraDominio(linha)), total };
  }

}
