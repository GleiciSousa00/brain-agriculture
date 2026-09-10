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
export type RespostaFalsa = { corpo: unknown } | { problema: Problema };

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
  return 'problema' in resposta
    ? respostaDeProblema(resposta.problema)
    : respostaDeSucesso(resposta.corpo);
}

/** Enfileira uma resposta de sucesso com o corpo dado. */
export function respondaCom(corpo: unknown): void {
  fetchFalso.mockResolvedValueOnce(respostaDeSucesso(corpo));
}

/** Enfileira uma resposta de erro no formato Problem Details. */
export function respondaComProblema(problema: Problema): void {
  fetchFalso.mockResolvedValueOnce(respostaDeProblema(problema));
}

/**
 * Atende por caminho, e não por ordem de chegada.
 *
 * A tela pede o painel e o catálogo de Safras no mesmo instante; casar resposta com
 * pedido pela ordem das chamadas amarraria o teste à ordem de declaração dos efeitos.
 */
export function servirRotas(
  rotas: Record<string, (url: URL) => RespostaFalsa | Promise<RespostaFalsa>>,
): void {
  fetchFalso.mockImplementation((entrada) => {
    const url = new URL((entrada as Request).url);
    const rota = rotas[url.pathname];

    if (rota === undefined) {
      return Promise.resolve(
        respostaDeProblema({
          status: 404,
          title: 'Not Found',
          detail: `Rota ${url.pathname} não foi servida no teste.`,
        }),
      );
    }

    // A rota pode devolver uma promessa, e é assim que um teste segura a resposta no ar
    // para afirmar o que a tela mostra enquanto ela não chega.
    return Promise.resolve(rota(url)).then(respostaDe);
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

/** Quantas vezes o caminho dado foi chamado. */
export function chamadasPara(caminho: string): number {
  return enderecosChamados().filter((endereco) => new URL(endereco).pathname === caminho).length;
}

/** Quantas chamadas houve ao todo, em qualquer caminho. */
export function totalDeChamadas(): number {
  return fetchFalso.mock.calls.length;
}
