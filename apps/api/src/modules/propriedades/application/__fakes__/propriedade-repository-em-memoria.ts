import type { Recortados } from '../../../../shared/domain/recorte';
import { nomeCasaComBusca } from '../../../../shared/domain/texto-para-busca';
import type { Propriedade } from '../../domain/propriedade';
import type {
  PropriedadeRepository,
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

  async list({
    deslocamento,
    limite,
    busca,
    ids,
  }: RecorteDePropriedades): Promise<Recortados<Propriedade>> {
    const ordenadas = [...this.propriedades.values()]
      .filter((propriedade) => ids === undefined || ids.includes(propriedade.id))
      .filter((propriedade) => nomeCasaComBusca(propriedade.nome, busca))
      .sort((uma, outra) => uma.nome.localeCompare(outra.nome) || uma.id.localeCompare(outra.id));

    return {
      itens: ordenadas.slice(deslocamento, deslocamento + limite),
      total: ordenadas.length,
    };
  }
}
