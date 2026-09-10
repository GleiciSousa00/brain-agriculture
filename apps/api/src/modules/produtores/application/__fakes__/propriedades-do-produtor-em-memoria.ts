import type { Recortados } from '../../../../shared/domain/recorte';
import type { Propriedade } from '../../../propriedades/domain/propriedade';
import type {
  PropriedadesDoProdutorRepository,
  RecorteDePropriedadesDoProdutor,
} from '../../domain/propriedades-do-produtor.repository';

/**
 * Substituto da porta que o módulo de Produtor abre para o de Propriedade. Como qualquer
 * `__fakes__`, é código de teste e não sobe para a imagem.
 */
export class PropriedadesDoProdutorEmMemoria implements PropriedadesDoProdutorRepository {
  private propriedades: Propriedade[] = [];

  acrescentar(...novas: Propriedade[]): void {
    this.propriedades.push(...novas);
  }

  async listByProdutor({
    produtorId,
    deslocamento,
    limite,
  }: RecorteDePropriedadesDoProdutor): Promise<Recortados<Propriedade>> {
    // A mesma ordem do repositório de verdade: nome, com o identificador desempatando.
    const doProdutor = this.propriedades
      .filter((propriedade) => propriedade.produtorId === produtorId)
      .sort(porNome);

    return {
      itens: doProdutor.slice(deslocamento, deslocamento + limite),
      total: doProdutor.length,
    };
  }

  async deleteByProdutor(produtorId: string): Promise<void> {
    this.propriedades = this.propriedades.filter(
      (propriedade) => propriedade.produtorId !== produtorId,
    );
  }
}

function porNome(uma: Propriedade, outra: Propriedade): number {
  if (uma.nome !== outra.nome) {
    return uma.nome < outra.nome ? -1 : 1;
  }

  return uma.id < outra.id ? -1 : 1;
}
