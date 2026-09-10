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

function respostaDe(corpo: unknown, status: number, tipo: string): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': tipo },
  });
}

/** Enfileira uma resposta de sucesso com o corpo dado. */
export function respondaCom(corpo: unknown): void {
  fetchFalso.mockResolvedValueOnce(respostaDe(corpo, 200, 'application/json'));
}

/** Enfileira uma resposta de erro no formato Problem Details. */
export function respondaComProblema(problema: Problema): void {
  fetchFalso.mockResolvedValueOnce(
    respostaDe({ type: 'about:blank', ...problema }, problema.status, 'application/problem+json'),
  );
}

/** O que uma rota do duplo devolve: um corpo de sucesso ou um problema. */
export type RespostaFalsa = { corpo: unknown } | { problema: Problema };

/**
 * Atende por caminho, e não por ordem de chegada.
 *
 * A tela pede o painel e o catálogo de Safras no mesmo instante; casar resposta com
 * pedido pela ordem das chamadas amarraria o teste à ordem de declaração dos efeitos.
 */
export function servirRotas(rotas: Record<string, (url: URL) => RespostaFalsa>): void {
  fetchFalso.mockImplementation((entrada) => {
    const url = new URL((entrada as Request).url);
    const rota = rotas[url.pathname];

    if (rota === undefined) {
      return Promise.resolve(
        respostaDe(
          { type: 'about:blank', title: 'Not Found', status: 404, detail: `Rota ${url.pathname} não foi servida no teste.` },
          404,
          'application/problem+json',
        ),
      );
    }

    const resposta = rota(url);

    return Promise.resolve(
      'problema' in resposta
        ? respostaDe(
            { type: 'about:blank', ...resposta.problema },
            resposta.problema.status,
            'application/problem+json',
          )
        : respostaDe(resposta.corpo, 200, 'application/json'),
    );
  });
}

/** O endereço de cada chamada feita até agora, na ordem. */
export function enderecosChamados(): string[] {
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
