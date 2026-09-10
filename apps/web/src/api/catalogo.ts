import type { AcrescentarCultura, CriarSafra, Cultura, Safra } from '@cadastro-rural/contracts';
import { colher } from './chamada';
import { api } from './cliente';

/**
 * Os dois catálogos compartilhados por todas as Propriedades.
 *
 * Nenhum dos dois é paginado na API: são listas curtas por natureza, e a interface as
 * mostra inteiras.
 */

/** O catálogo de Culturas, em ordem alfabética. */
export async function listarCulturas(): Promise<Cultura[]> {
  return colher(() => api.GET('/culturas', {}));
}

/** Acrescenta uma espécie ao catálogo. */
export async function acrescentarCultura(corpo: AcrescentarCultura): Promise<Cultura> {
  return colher(() => api.POST('/culturas', { body: corpo }));
}

/** O catálogo de Safras, da mais recente para a mais antiga. */
export async function listarSafras(): Promise<Safra[]> {
  return colher(() => api.GET('/safras', {}));
}

/** Registra uma Safra, que passa a valer para todas as Propriedades. */
export async function criarSafra(corpo: CriarSafra): Promise<Safra> {
  return colher(() => api.POST('/safras', { body: corpo }));
}
