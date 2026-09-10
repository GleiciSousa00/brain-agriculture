import type { Repository } from 'typeorm';
import type { Recorte, Recortados } from '../../../shared/domain/recorte';
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
      // A rede de baixo: duas requisições simultâneas passam pela conferência do caso de
      // uso e só a restrição do banco separa as duas.
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
    // Só igualdade exata: o valor cifrado muda a cada gravação e não serve para busca.
    const linha = await this.linhas.findOneBy({
      documentoImpressao: this.mapper.impressaoDe(documento),
    });

    return linha === null ? null : this.mapper.paraDominio(linha);
  }

  async list({ deslocamento, limite }: Recorte): Promise<Recortados<Produtor>> {
    // O identificador desempata homônimos: sem critério estável, duas páginas seguidas
    // poderiam trazer o mesmo Produtor e esconder outro.
    const [linhas, total] = await this.linhas.findAndCount({
      order: { nome: 'ASC', id: 'ASC' },
      skip: deslocamento,
      take: limite,
    });

    return { itens: linhas.map((linha) => this.mapper.paraDominio(linha)), total };
  }
}
