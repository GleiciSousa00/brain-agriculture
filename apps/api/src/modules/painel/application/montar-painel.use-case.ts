import type { Painel, PlantiosPorCultura } from '../domain/painel';
import type { CulturasDoPainelRepository } from '../domain/culturas-do-painel.repository';
import type {
  PlantiosDaCultura,
  PlantiosDoPainelRepository,
} from '../domain/plantios-do-painel.repository';
import type { PropriedadesDoPainelRepository } from '../domain/propriedades-do-painel.repository';

export interface FiltroDoPainel {
  /**
   * Recorta apenas a distribuição por Cultura.
   *
   * Os dois totais e as distribuições por estado e por Uso do Solo descrevem o cadastro
   * inteiro e não mudam com ele: filtrá-los por Safra devolveria o Uso do Solo das
   * Propriedades que por acaso plantaram naquele ciclo, um número que não responde a
   * pergunta nenhuma.
   */
  safraId?: string;
}

/**
 * Reúne os números do painel.
 *
 * Cada porta devolve um resultado já agregado pelo banco, e este caso de uso só os junta:
 * ele não soma, não conta e não percorre cadastro. É o que o registro 0004 exige.
 *
 * As três consultas independentes vão juntas. A quarta, que traz os nomes do catálogo,
 * depende de saber quais Culturas apareceram, e por isso vem depois.
 */
export class MontarPainelUseCase {
  constructor(
    private readonly propriedades: PropriedadesDoPainelRepository,
    private readonly plantios: PlantiosDoPainelRepository,
    private readonly culturas: CulturasDoPainelRepository,
  ) {}

  async execute({ safraId }: FiltroDoPainel): Promise<Painel> {
    const [resumo, propriedadesPorEstado, porCultura] = await Promise.all([
      this.propriedades.resumir(),
      this.propriedades.contarPorEstado(),
      this.plantios.contarPorCultura(safraId),
    ]);

    return {
      totais: { propriedades: resumo.propriedades, areaTotal: resumo.areaTotal },
      usoDoSolo: {
        areaAgricultavel: resumo.areaAgricultavel,
        areaDeVegetacao: resumo.areaDeVegetacao,
      },
      propriedadesPorEstado,
      plantiosPorCultura: await this.nomear(porCultura),
    };
  }

  private async nomear(fatias: PlantiosDaCultura[]): Promise<PlantiosPorCultura[]> {
    const nomes = await this.culturas.nomesPorId(fatias.map((fatia) => fatia.culturaId));

    return fatias.map((fatia) => ({
      culturaId: fatia.culturaId,
      cultura: nomeDe(nomes, fatia.culturaId),
      plantios: fatia.plantios,
    }));
  }
}

/**
 * A chave estrangeira do Plantio para a Cultura é `ON DELETE RESTRICT`, então toda Cultura
 * contada existe no catálogo. Ficar sem nome aqui é banco inconsistente, e falhar alto,
 * com o rastro no log, é melhor do que desenhar uma fatia sem rótulo.
 */
function nomeDe(nomes: Map<string, string>, culturaId: string): string {
  const nome = nomes.get(culturaId);

  if (nome === undefined) {
    throw new Error(`O Plantio aponta para a Cultura ${culturaId}, que não está no catálogo.`);
  }

  return nome;
}
