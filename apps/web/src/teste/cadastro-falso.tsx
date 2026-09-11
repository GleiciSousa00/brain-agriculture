import type { Cultura, Plantio, Produtor, Propriedade, Safra } from '@cadastro-rural/contracts';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
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

/** A mesma dobra que o banco aplica: quem procura "sao jose" acha "São José". */
function dobrar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** O nome pelo qual se procura. Nem toda listagem tem um: Plantio se lista pela Propriedade. */
function nomeDe(item: unknown): string {
  const { nome } = item as { nome?: unknown };

  return typeof nome === 'string' ? nome : '';
}

/**
 * Fatia a lista como a API a fatiaria, honrando a página, o tamanho e a busca pedidos.
 *
 * A busca é recortada aqui, e não por quem serve a rota, porque é assim que a API faz: o
 * campo de escolha que procura precisa ver a lista encolher para provar que procurou.
 */
export function paginar<T>(itens: T[], url: URL) {
  const pagina = Number(url.searchParams.get('pagina') ?? '1');
  const tamanho = Number(url.searchParams.get('tamanho') ?? '10');
  const busca = url.searchParams.get('busca');
  const inicio = (pagina - 1) * tamanho;
  const casam =
    busca === null
      ? itens
      : itens.filter((item) => dobrar(nomeDe(item)).includes(dobrar(busca)));

  return { itens: casam.slice(inicio, inicio + tamanho), total: casam.length, pagina, tamanho };
}

/**
 * Recorta pelos identificadores pedidos, como as duas listagens que aceitam `ids` fazem.
 *
 * Sem `ids` lista todo mundo, e com `ids` lista só quem foi pedido — inclusive ninguém, que
 * é o que a API responde a uma lista vazia de identificadores.
 */
function recortarPorId<T extends { id: string }>(itens: T[], url: URL): T[] {
  if (!url.searchParams.has('ids')) {
    return itens;
  }

  const ids = url.searchParams.getAll('ids');

  return itens.filter((item) => ids.includes(item.id));
}

/**
 * As quatro listagens que o cadastro busca, servidas como a API as serve.
 *
 * As listas são lidas a cada pedido, e não copiadas: um teste que empurra um registro
 * dentro do vetor vê a tela se refazer com ele, que é como a escrita de verdade aparece.
 *
 * As duas listagens recortam por identificador, que é como a tela resolve o nome dos donos
 * de uma página de Propriedades e o da Propriedade que o endereço aponta. A de Produtores
 * conta as Propriedades de cada um: contar aqui, e não no teste, é o que deixa a contagem e
 * a base contadas pela mesma fonte.
 */
export function rotasDosCatalogos(base: Partial<BaseFalsa> = {}): Record<string, RotaFalsa> {
  const { produtores = [], propriedades = [], culturas = [], safras = [] } = base;

  return {
    'GET /api/produtores': ({ url }) => ({
      corpo: paginar(
        recortarPorId(produtores, url).map((produtor) => ({
          ...produtor,
          propriedades: propriedades.filter((uma) => uma.produtorId === produtor.id).length,
        })),
        url,
      ),
    }),
    'GET /api/propriedades': ({ url }) => ({
      corpo: paginar(recortarPorId(propriedades, url), url),
    }),
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

/**
 * Monta uma seção dentro do provedor, que é o único lugar onde ela funciona.
 *
 * O endereço vai junto porque é dele que sai o recorte da hierarquia: passar
 * `/cadastro/propriedades?produtor=x` é como se chega às Propriedades de um Produtor.
 */
export function renderizarNoCadastro(secao: ReactNode, endereco = '/cadastro') {
  return render(
    <MemoryRouter initialEntries={[endereco]}>
      <CadastroProvider>{secao}</CadastroProvider>
    </MemoryRouter>,
  );
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
