import type { Painel, ProblemDetails, Safra } from '@cadastro-rural/contracts';
import { api } from './cliente';

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
  readonly status?: number;

  constructor(mensagem: string, detalhes: { codigo?: string; status?: number } = {}) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.codigo = detalhes.codigo;
    this.status = detalhes.status;
  }
}

function erroDoProblema(problema: ProblemDetails): ErroDaApi {
  return new ErroDaApi(problema.detail ?? problema.title, {
    codigo: problema.codigo,
    status: problema.status,
  });
}

/** Desembrulha o resultado do cliente gerado, ou levanta `ErroDaApi`. */
async function colher<T>(
  chamada: () => Promise<{ data?: T; error?: ProblemDetails }>,
): Promise<T> {
  let resultado: { data?: T; error?: ProblemDetails };

  try {
    resultado = await chamada();
  } catch {
    throw new ErroDaApi(SEM_RESPOSTA);
  }

  if (resultado.error !== undefined) {
    throw erroDoProblema(resultado.error);
  }

  if (resultado.data === undefined) {
    throw new ErroDaApi(SEM_CORPO);
  }

  return resultado.data;
}

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
