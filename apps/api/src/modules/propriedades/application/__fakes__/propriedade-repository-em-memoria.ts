import type { Propriedade } from '../../domain/propriedade';
import type {
  PropriedadeRepository,
  PropriedadesRecortadas,
  RecorteDePropriedades,
} from '../../domain/propriedade.repository';

/**
 * Repositório substituto, usado pelos testes de caso de uso. `__fakes__` fica fora do
 * build: é código de teste e não sobe para a imagem.
 */
export class PropriedadeRepositoryEmMemoria implements PropriedadeRepository {
  private readonly propriedades = new Map<string, Propriedade>();

  async save(propriedade: Propriedade): Promise<void> {
    this.propriedades.set(propriedade.id, propriedade);
  }

  async findById(id: string): Promise<Propriedade | null> {
    return this.propriedades.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.propriedades.delete(id);
  }

  async list({ deslocamento, limite }: RecorteDePropriedades): Promise<PropriedadesRecortadas> {
    // A mesma ordem que o repositório de verdade promete. Um substituto que ordena
    // diferente faz o teste de paginação passar por acidente.
    const ordenadas = [...this.propriedades.values()].sort(
      (uma, outra) => uma.cidade.localeCompare(outra.cidade) || uma.id.localeCompare(outra.id),
    );

    return {
      itens: ordenadas.slice(deslocamento, deslocamento + limite),
      total: ordenadas.length,
    };
  }
}
