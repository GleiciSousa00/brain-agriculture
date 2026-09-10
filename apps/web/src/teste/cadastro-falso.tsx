import type { Cultura, Plantio, Produtor, Propriedade, Safra } from '@cadastro-rural/contracts';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CadastroProvider } from '../paginas/cadastro/CadastroContexto';
import type { RotaFalsa } from './fetch-falso';
import { servirRotas } from './fetch-falso';

/** A base que o duplo serve às seções do cadastro. */
export interface BaseFalsa {
  produtores: Produtor[];
  propriedades: Propriedade[];
  culturas: Cultura[];
  safras: Safra[];
}

/** Fatia a lista como a API a fatiaria, honrando a página e o tamanho pedidos. */
export function paginar<T>(itens: T[], url: URL) {
  const pagina = Number(url.searchParams.get('pagina') ?? '1');
  const tamanho = Number(url.searchParams.get('tamanho') ?? '10');
  const inicio = (pagina - 1) * tamanho;

  return { itens: itens.slice(inicio, inicio + tamanho), total: itens.length, pagina, tamanho };
}

/**
 * As quatro listagens que o contexto do cadastro busca ao montar.
 *
 * As listas são lidas a cada pedido, e não copiadas: um teste que empurra um registro
 * dentro do vetor vê a tela se refazer com ele, que é como a escrita de verdade aparece.
 */
export function rotasDosCatalogos(base: Partial<BaseFalsa> = {}): Record<string, RotaFalsa> {
  const { produtores = [], propriedades = [], culturas = [], safras = [] } = base;

  return {
    'GET /api/produtores': ({ url }) => ({ corpo: paginar(produtores, url) }),
    'GET /api/propriedades': ({ url }) => ({ corpo: paginar(propriedades, url) }),
    'GET /api/culturas': () => ({ corpo: culturas }),
    'GET /api/safras': () => ({ corpo: safras }),
  };
}

/** Serve os catálogos e mais o que a seção sob teste precisar. */
export function servirCadastro(
  base: Partial<BaseFalsa> = {},
  extras: Record<string, RotaFalsa> = {},
): void {
  servirRotas({ ...rotasDosCatalogos(base), ...extras });
}

/** Monta uma seção dentro do provedor, que é o único lugar onde ela funciona. */
export function renderizarNoCadastro(secao: ReactNode) {
  return render(<CadastroProvider>{secao}</CadastroProvider>);
}

/** Um Plantio, montado a partir da trinca que o identifica. */
export function plantioDe(
  id: string,
  propriedade: Propriedade,
  cultura: Cultura,
  safra: Safra,
): Plantio {
  return { id, propriedadeId: propriedade.id, culturaId: cultura.id, safraId: safra.id };
}
