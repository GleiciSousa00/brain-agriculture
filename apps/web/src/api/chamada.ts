import type { ProblemDetails } from '@cadastro-rural/contracts';

/**
 * O que a tela mostra quando a resposta nem chega.
 *
 * Este e os outros textos deste arquivo são os únicos escritos na interface, e todos
 * valem só para o caso em que não há corpo Problem Details que se pudesse citar. Havendo
 * um, quem fala é ele.
 */
const SEM_RESPOSTA = 'Não foi possível falar com a API. Verifique se ela está de pé.';

/** O que a tela mostra quando a resposta chega vazia, o que não deveria acontecer. */
const SEM_CORPO = 'A API respondeu sem conteúdo.';

/**
 * Falha vinda da API.
 *
 * A mensagem é o `detail` do corpo Problem Details, copiado sem reescrita, e o `codigo`
 * identifica o erro sem depender do texto.
 */
export class ErroDaApi extends Error {
  readonly codigo?: string;

  constructor(mensagem: string, codigo?: string) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.codigo = codigo;
  }
}

/** O que a tela mostra quando a falha não é uma recusa da API, e portanto não tem texto. */
const FALHA_SEM_NOME = 'Algo deu errado ao falar com a API.';

/**
 * O texto que a tela mostra para uma falha.
 *
 * Vindo da API, é o `detail` do corpo Problem Details, copiado sem reescrita. O outro
 * ramo é rede de segurança para o que não é `ErroDaApi`.
 */
export function mensagemDe(causa: unknown): string {
  return causa instanceof ErroDaApi ? causa.message : FALHA_SEM_NOME;
}

/**
 * O que a tela mostra quando o pedido foi recusado e não veio Problem Details que se
 * pudesse citar, como no 502 de um repassador que a API nem chegou a ver.
 */
function recusaSemTexto(resposta: Response): string {
  return `A API recusou o pedido com o status ${String(resposta.status)}.`;
}

/** O que o cliente gerado devolve: o corpo de sucesso ou o corpo de erro, e a resposta. */
type Resultado<T> = { data?: T; error?: ProblemDetails; response: Response };

/**
 * Faz a chamada e levanta `ErroDaApi` se ela não deu certo.
 *
 * Toda chamada à API passa por aqui, para que exista um lugar só onde a resposta vira
 * valor ou erro.
 *
 * O status é conferido além do corpo de erro porque uma recusa sem corpo não produz
 * `error` nenhum no cliente gerado: sem esta conferência, uma exclusão recusada com 502
 * passaria por bem-sucedida e a linha sumiria da tela sem ter sumido do banco.
 */
async function tentar<T>(chamada: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  let resultado: Resultado<T>;

  try {
    resultado = await chamada();
  } catch {
    throw new ErroDaApi(SEM_RESPOSTA);
  }

  if (resultado.error !== undefined) {
    const problema = resultado.error;

    throw new ErroDaApi(
      problema.detail ?? problema.title ?? recusaSemTexto(resultado.response),
      problema.codigo,
    );
  }

  if (!resultado.response.ok) {
    throw new ErroDaApi(recusaSemTexto(resultado.response));
  }

  return resultado;
}

/** Desembrulha o corpo de uma resposta que tem corpo, ou levanta `ErroDaApi`. */
export async function colher<T>(chamada: () => Promise<Resultado<T>>): Promise<T> {
  const { data } = await tentar(chamada);

  if (data === undefined) {
    throw new ErroDaApi(SEM_CORPO);
  }

  return data;
}

/**
 * Espera uma resposta que não tem corpo, como o 204 de uma exclusão.
 *
 * Só interessa saber que não houve recusa. Passar por `colher` acusaria a ausência de
 * corpo como falha, quando ela é justamente o que a API promete.
 */
export async function colherVazio(chamada: () => Promise<Resultado<never>>): Promise<void> {
  await tentar(chamada);
}
