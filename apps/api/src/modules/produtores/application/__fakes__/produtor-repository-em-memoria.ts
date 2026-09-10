import type { Documento } from '../../domain/documento';
import type { Produtor } from '../../domain/produtor';
import type { ProdutorRepository } from '../../domain/produtor.repository';

/**
 * Repositório substituto, usado pelos testes de caso de uso. `__fakes__` fica fora do
 * build: é código de teste e não sobe para a imagem.
 *
 * Que ele exista é o ponto do registro 0005: é por não depender de banco que o caso de
 * uso pode ser testado sem Postgres.
 */
export class ProdutorRepositoryEmMemoria implements ProdutorRepository {
  private readonly produtores = new Map<string, Produtor>();

  async save(produtor: Produtor): Promise<void> {
    this.produtores.set(produtor.id, produtor);
  }

  async findById(id: string): Promise<Produtor | null> {
    return this.produtores.get(id) ?? null;
  }

  async findByDocumento(documento: Documento): Promise<Produtor | null> {
    for (const produtor of this.produtores.values()) {
      if (produtor.documento.igualA(documento)) {
        return produtor;
      }
    }

    return null;
  }
}
