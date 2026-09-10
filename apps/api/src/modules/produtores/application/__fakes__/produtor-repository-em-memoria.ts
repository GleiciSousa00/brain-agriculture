import type { Recorte, Recortados } from '../../../../shared/domain/recorte';
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

  async update(produtor: Produtor): Promise<void> {
    this.produtores.set(produtor.id, produtor);
  }

  async delete(id: string): Promise<void> {
    this.produtores.delete(id);
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

  /** A mesma ordem que o repositório de verdade promete: nome, e o identificador desempata. */
  async list({ deslocamento, limite }: Recorte): Promise<Recortados<Produtor>> {
    const ordenados = [...this.produtores.values()].sort(
      (um, outro) => um.nome.localeCompare(outro.nome) || um.id.localeCompare(outro.id),
    );

    return {
      itens: ordenados.slice(deslocamento, deslocamento + limite),
      total: ordenados.length,
    };
  }
}
