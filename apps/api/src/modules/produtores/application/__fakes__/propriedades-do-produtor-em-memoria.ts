import type { Propriedade } from '../../../propriedades/domain/propriedade';
import type { PropriedadesDoProdutorRepository } from '../../domain/propriedades-do-produtor.repository';

/**
 * Substituto da porta que o módulo de Produtor abre para o de Propriedade. Como qualquer
 * `__fakes__`, é código de teste e não sobe para a imagem.
 */
export class PropriedadesDoProdutorEmMemoria implements PropriedadesDoProdutorRepository {
  private propriedades: Propriedade[] = [];

  acrescentar(...novas: Propriedade[]): void {
    this.propriedades.push(...novas);
  }

  async listByProdutor(produtorId: string): Promise<Propriedade[]> {
    return this.propriedades.filter((propriedade) => propriedade.produtorId === produtorId);
  }

  async deleteByProdutor(produtorId: string): Promise<void> {
    this.propriedades = this.propriedades.filter(
      (propriedade) => propriedade.produtorId !== produtorId,
    );
  }
}
