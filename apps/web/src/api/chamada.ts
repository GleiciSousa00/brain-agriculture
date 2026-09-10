import type { ProblemDetails } from '@cadastro-rural/contracts';

/**
 * O que a tela mostra quando a resposta nem chega. É o único texto de erro escrito
 * aqui: havendo resposta, quem fala é o corpo Problem Details da API.
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

/**
 * Desembrulha o resultado do cliente gerado, ou levanta `ErroDaApi`.
 *
 * Toda chamada à API passa por aqui, para que exista um lugar só onde a resposta vira
 * valor ou erro.
 */
export async function colher<T>(
  chamada: () => Promise<{ data?: T; error?: ProblemDetails }>,
): Promise<T> {
  let resultado: { data?: T; error?: ProblemDetails };

  try {
    resultado = await chamada();
  } catch {
    throw new ErroDaApi(SEM_RESPOSTA);
  }

  if (resultado.error !== undefined) {
    const problema = resultado.error;

    throw new ErroDaApi(problema.detail ?? problema.title, problema.codigo);
  }

  if (resultado.data === undefined) {
    throw new ErroDaApi(SEM_CORPO);
  }

  return resultado.data;
}
