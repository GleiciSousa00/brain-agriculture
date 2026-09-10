import { vi } from 'vitest';

/**
 * O `fetch` que a suíte inteira usa no lugar da rede.
 *
 * Ele vive num módulo próprio, e não dentro de um teste, porque o cliente gerado guarda
 * o `globalThis.fetch` no instante em que é criado. O duplo precisa estar no lugar antes
 * de `src/api/cliente.ts` ser carregado, e quem garante isso é `preparo.ts`, que o
 * `setupFiles` roda primeiro.
 */
export const fetchFalso = vi.fn<typeof fetch>();

/** Um erro no formato Problem Details, como a API o devolve. */
export interface Problema {
  status: number;
  title: string;
  detail?: string;
  codigo?: string;
}

/** O que uma rota do duplo devolve: um corpo de sucesso ou um problema. */
export type RespostaFalsa = { corpo: unknown } | { problema: Problema } | { semConteudo: true };

/** O pedido que chegou à rota, já desmontado. */
export interface PedidoFalso {
  url: URL;
  /** O que o padrão da rota casou, como o `id` de `DELETE /api/produtores/:id`. */
  parametros: Record<string, string>;
  /** O corpo enviado, já desserializado. Fica indefinido quando não houve corpo. */
  corpo: unknown;
}

/** Uma rota do duplo: o que ela responde ao pedido que casou com o padrão dela. */
export type RotaFalsa = (pedido: PedidoFalso) => RespostaFalsa | Promise<RespostaFalsa>;

function respostaDeSucesso(corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function respostaDeProblema(problema: Problema): Response {
  return new Response(JSON.stringify({ type: 'about:blank', ...problema }), {
    status: problema.status,
    headers: { 'content-type': 'application/problem+json' },
  });
}

function respostaDe(resposta: RespostaFalsa): Response {
  if ('problema' in resposta) {
    return respostaDeProblema(resposta.problema);
  }

  // O 204 de uma exclusão. `Response` recusa corpo com esse status, e é justamente o que
  // a interface encontra: quem trata a resposta não pode esperar JSON.
  return 'semConteudo' in resposta ? new Response(null, { status: 204 }) : respostaDeSucesso(resposta.corpo);
}

/** Enfileira uma resposta de sucesso com o corpo dado. */
export function respondaCom(corpo: unknown): void {
  fetchFalso.mockResolvedValueOnce(respostaDeSucesso(corpo));
}

/** Enfileira uma resposta de erro no formato Problem Details. */
export function respondaComProblema(problema: Problema): void {
  fetchFalso.mockResolvedValueOnce(respostaDeProblema(problema));
}

/** Enfileira o 204 sem corpo com que a API responde a uma exclusão. */
export function respondaSemConteudo(): void {
  fetchFalso.mockResolvedValueOnce(new Response(null, { status: 204 }));
}

/**
 * Casa um padrão com o caminho pedido, devolvendo o que os parâmetros pegaram.
 *
 * O padrão é o caminho com segmentos de parâmetro prefixados por dois-pontos, como
 * `/api/produtores/:id`. Devolve indefinido quando não casa.
 */
function parametrosDe(padrao: string, caminho: string): Record<string, string> | undefined {
  const doPadrao = padrao.split('/');
  const doCaminho = caminho.split('/');

  if (doPadrao.length !== doCaminho.length) {
    return undefined;
  }

  const parametros: Record<string, string> = {};

  for (const [indice, segmento] of doPadrao.entries()) {
    const pedido = doCaminho[indice] ?? '';

    if (segmento.startsWith(':')) {
      parametros[segmento.slice(1)] = decodeURIComponent(pedido);
    } else if (segmento !== pedido) {
      return undefined;
    }
  }

  return parametros;
}

/** Quantos segmentos de parâmetro o padrão tem. Quem tem menos é mais específico. */
function quantosParametros(padrao: string): number {
  return padrao.split('/').filter((segmento) => segmento.startsWith(':')).length;
}

interface RotaCasada {
  rota: RotaFalsa;
  parametros: Record<string, string>;
  parametrosNoPadrao: number;
}

/** A rota mais específica entre as que casam: quem tem menos parâmetro ganha. */
function escolherRota(
  rotas: Record<string, RotaFalsa>,
  metodo: string,
  caminho: string,
): RotaCasada | undefined {
  let escolhida: RotaCasada | undefined;

  for (const [chave, rota] of Object.entries(rotas)) {
    const [metodoDaRota = '', padrao = ''] = chave.split(' ');

    if (metodoDaRota !== metodo) {
      continue;
    }

    const parametros = parametrosDe(padrao, caminho);
    const parametrosNoPadrao = quantosParametros(padrao);

    if (parametros !== undefined && (escolhida === undefined || parametrosNoPadrao < escolhida.parametrosNoPadrao)) {
      escolhida = { rota, parametros, parametrosNoPadrao };
    }
  }

  return escolhida;
}

async function desmontar(pedido: Request, parametros: Record<string, string>): Promise<PedidoFalso> {
  const texto = await pedido.clone().text();

  return {
    url: new URL(pedido.url),
    parametros,
    corpo: texto === '' ? undefined : (JSON.parse(texto) as unknown),
  };
}

/**
 * Atende por método e caminho, e não por ordem de chegada.
 *
 * A tela pede vários catálogos no mesmo instante; casar resposta com pedido pela ordem
 * das chamadas amarraria o teste à ordem de declaração dos efeitos. A chave é o método e
 * o padrão do caminho juntos, como `POST /api/produtores` ou `DELETE /api/produtores/:id`,
 * porque um mesmo caminho serve a verbos diferentes e responde coisas diferentes a cada um.
 */
export function servirRotas(rotas: Record<string, RotaFalsa>): void {
  fetchFalso.mockImplementation((entrada) => {
    const pedido = entrada as Request;
    const url = new URL(pedido.url);
    const casada = escolherRota(rotas, pedido.method, url.pathname);

    if (casada === undefined) {
      return Promise.resolve(
        respostaDeProblema({
          status: 404,
          title: 'Not Found',
          detail: `A rota ${pedido.method} ${url.pathname} não foi servida no teste.`,
        }),
      );
    }

    // A rota pode devolver uma promessa, e é assim que um teste segura a resposta no ar
    // para afirmar o que a tela mostra enquanto ela não chega.
    return desmontar(pedido, casada.parametros)
      .then(casada.rota)
      .then(respostaDe);
  });
}

/** O endereço de cada chamada feita até agora, na ordem. */
function enderecosChamados(): string[] {
  return fetchFalso.mock.calls.map(([pedido]) => (pedido as Request).url);
}

/** O endereço de uma chamada, já desmontado. Erra se ela não aconteceu. */
export function enderecoDaChamada(indice = 0): URL {
  const endereco = enderecosChamados()[indice];

  if (endereco === undefined) {
    throw new Error(`Não houve chamada de índice ${indice}.`);
  }

  return new URL(endereco);
}

/** O método de uma chamada, como `POST`. Erra se ela não aconteceu. */
export function metodoDaChamada(indice = 0): string {
  const pedido = fetchFalso.mock.calls[indice]?.[0] as Request | undefined;

  if (pedido === undefined) {
    throw new Error(`Não houve chamada de índice ${indice}.`);
  }

  return pedido.method;
}

/** O corpo enviado numa chamada, já desserializado. Erra se ela não aconteceu. */
export async function corpoDaChamada(indice = 0): Promise<unknown> {
  const pedido = fetchFalso.mock.calls[indice]?.[0] as Request | undefined;

  if (pedido === undefined) {
    throw new Error(`Não houve chamada de índice ${indice}.`);
  }

  const texto = await pedido.clone().text();

  return texto === '' ? undefined : (JSON.parse(texto) as unknown);
}

/**
 * O corpo do primeiro pedido feito com esse método nesse caminho.
 *
 * Achar o pedido pelo que ele é, e não pela posição dele na fila, porque a tela dispara
 * várias buscas de uma vez e a ordem entre elas não é promessa de ninguém.
 */
export async function corpoEnviadoPara(metodo: string, caminho: string): Promise<unknown> {
  const pedidos = fetchFalso.mock.calls.map(([pedido]) => pedido as Request);
  const achado = pedidos.find(
    (pedido) => pedido.method === metodo && new URL(pedido.url).pathname === caminho,
  );

  if (achado === undefined) {
    throw new Error(`Não houve pedido ${metodo} ${caminho}.`);
  }

  const texto = await achado.clone().text();

  return texto === '' ? undefined : (JSON.parse(texto) as unknown);
}

/** Quantas vezes o caminho dado foi chamado, em qualquer método. */
export function chamadasPara(caminho: string): number {
  return enderecosChamados().filter((endereco) => new URL(endereco).pathname === caminho).length;
}

/** Quantas chamadas houve ao todo, em qualquer caminho. */
export function totalDeChamadas(): number {
  return fetchFalso.mock.calls.length;
}
