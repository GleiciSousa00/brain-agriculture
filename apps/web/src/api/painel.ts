import type { Painel, Safra } from '@cadastro-rural/contracts';
import { colher } from './chamada';
import { api } from './cliente';

/**
 * Os números do painel, numa chamada só.
 *
 * A Safra, quando informada, recorta apenas a distribuição por Cultura. Os dois totais e
 * as distribuições por estado e por Uso do Solo descrevem o cadastro inteiro.
 */
export async function buscarPainel(safraId?: string): Promise<Painel> {
  return colher(() =>
    api.GET('/painel', {
      params: { query: safraId === undefined ? {} : { safraId } },
    }),
  );
}

/** O catálogo de Safras, que alimenta o controle ao lado do gráfico de Cultura. */
export async function buscarSafras(): Promise<Safra[]> {
  return colher(() => api.GET('/safras', {}));
}
