import type { Cultura } from '../../../culturas/domain/cultura';
import type { CulturasDoPainelRepository } from '../../domain/culturas-do-painel.repository';

/**
 * Substituto da porta que o painel abre para o catálogo de Cultura.
 *
 * Como o repositório de verdade, ele devolve apenas os identificadores que encontrou: quem
 * não está no catálogo não aparece no mapa.
 */
export class CulturasDoPainelEmMemoria implements CulturasDoPainelRepository {
  private readonly catalogo = new Map<string, string>();

  acrescentar(...culturas: Cultura[]): void {
    for (const cultura of culturas) {
      this.catalogo.set(cultura.id, cultura.nome);
    }
  }

  async nomesPorId(ids: string[]): Promise<Map<string, string>> {
    const encontrados = new Map<string, string>();

    for (const id of ids) {
      const nome = this.catalogo.get(id);

      if (nome !== undefined) {
        encontrados.set(id, nome);
      }
    }

    return encontrados;
  }
}
