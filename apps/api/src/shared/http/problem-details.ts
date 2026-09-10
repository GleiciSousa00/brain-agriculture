import { HttpException, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import type { z } from 'zod';
import { DomainError, type NaturezaDaFalha } from '../domain/domain-error';
import type { problemDetailsSchema } from './dto/problem-details.dto';

/**
 * O formato único de erro, inferido do esquema que também gera a especificação.
 *
 * O esquema é a fonte: o tipo daqui, o que sai na resposta e o que o cliente do pacote de
 * contratos enxerga saem todos dele, e não podem divergir entre si.
 */
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

/** Um campo recusado pelo esquema de entrada, com o motivo da recusa. */
type ErroDeCampo = NonNullable<ProblemDetails['erros']>[number];

/**
 * A tradução entre a natureza da falha, que é vocabulário de domínio, e o status HTTP,
 * que é vocabulário desta camada. É aqui que a fronteira do registro 0005 é atravessada,
 * e em nenhum outro lugar.
 */
const STATUS_POR_NATUREZA: Record<NaturezaDaFalha, number> = {
  'entrada-invalida': HttpStatus.BAD_REQUEST,
  conflito: HttpStatus.CONFLICT,
  'nao-encontrado': HttpStatus.NOT_FOUND,
};

/** Tipo de conteúdo da resposta de erro, conforme a RFC 9457. */
export const PROBLEM_DETAILS_CONTENT_TYPE = 'application/problem+json';

/** Sem catálogo de tipos de problema publicado, a RFC manda usar este URI. */
const DEFAULT_TYPE = 'about:blank';

const INTERNAL_FAILURE_DETAIL =
  'A requisição não pôde ser concluída. Consulte o identificador de correlação no log.';

/** O tipo de conteúdo é um só, e quem o recusa diz sempre a mesma coisa. */
export const SO_ACEITA_JSON = 'A API só aceita corpo em application/json.';

/**
 * O que se diz de uma recusa que não passou por esta aplicação.
 *
 * O corpo grande demais é barrado pelo interpretador de corpo do Express, antes de
 * qualquer código nosso: o erro não é `HttpException`, mas traz o status, e sem este texto
 * a resposta sairia com a mensagem em inglês da biblioteca.
 */
const DETALHE_POR_STATUS: Record<number, string> = {
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'O corpo da requisição passa do tamanho que a API aceita.',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: SO_ACEITA_JSON,
};

/** O que se diz de uma recusa sem texto próprio nem status conhecido. */
const RECUSA_SEM_TEXTO = 'A requisição foi recusada.';

interface ProblemInput {
  /** O que foi lançado. Pode não ser sequer um erro. */
  error: unknown;
  /** A URI que sofreu a falha. */
  instance: string;
  /** O identificador que liga a resposta às linhas de log da requisição. */
  correlationId: string;
}

/**
 * Traduz qualquer coisa lançada para o formato único de erro da API.
 *
 * Erro que a aplicação não previu vira 500 com detalhe genérico: mensagem de exceção
 * interna pode carregar segredo, e o rastro fica no log, ligado pelo identificador de
 * correlação.
 */
export function toProblemDetails({ error, instance, correlationId }: ProblemInput): ProblemDetails {
  const { status, detail, codigo, erros } = classificar(error);

  return {
    type: DEFAULT_TYPE,
    title: statusTitle(status),
    status,
    detail,
    instance,
    correlationId,
    ...(codigo === undefined ? {} : { codigo }),
    ...(erros === undefined ? {} : { erros }),
  };
}

interface Classificacao {
  status: number;
  detail: string;
  codigo?: string;
  erros?: ErroDeCampo[];
}

function classificar(error: unknown): Classificacao {
  if (error instanceof DomainError) {
    return {
      status: STATUS_POR_NATUREZA[error.natureza],
      detail: error.message,
      codigo: error.codigo,
    };
  }

  if (error instanceof ZodValidationException) {
    return classificarRecusaDeEsquema(error);
  }

  if (error instanceof HttpException) {
    return { status: error.getStatus(), detail: exceptionDetail(error) };
  }

  const status = statusDeErroDeFora(error);

  if (status !== undefined) {
    return { status, detail: DETALHE_POR_STATUS[status] ?? RECUSA_SEM_TEXTO };
  }

  return { status: HttpStatus.INTERNAL_SERVER_ERROR, detail: INTERNAL_FAILURE_DETAIL };
}

/**
 * O status de um erro que não é `HttpException` mas sabe qual recusa é.
 *
 * É o caso dos erros do interpretador de corpo do Express, como o do corpo grande demais.
 * Sem isto eles cairiam no 500, e a consumidora leria "erro interno" no que é recusa dela.
 * Só a faixa 4xx e 5xx passa: `status` é campo comum demais para ser aceito de olhos
 * fechados em qualquer objeto lançado.
 */
function statusDeErroDeFora(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const candidato = typeof status === 'number' ? status : statusCode;

  return typeof candidato === 'number' && candidato >= 400 && candidato <= 599
    ? candidato
    : undefined;
}

/**
 * A recusa do esquema de entrada, campo a campo.
 *
 * A exceção do `nestjs-zod` traz sempre a mesma mensagem, "Validation failed", e a lista
 * de problemas fica noutro campo. Quem integra precisa saber qual campo foi recusado e
 * por quê: sem isso a interface não tem como apontar o erro no formulário.
 */
function classificarRecusaDeEsquema(error: ZodValidationException): Classificacao {
  const erros = errosDeCampo(error);

  return {
    status: error.getStatus(),
    detail:
      erros.length === 0
        ? exceptionDetail(error)
        : erros.map(({ campo, mensagem }) => `${campo}: ${mensagem}`).join('; '),
    erros: erros.length === 0 ? undefined : erros,
  };
}

/** O campo a que a recusa se refere quando o esquema recusou o corpo inteiro. */
const CORPO_INTEIRO = 'corpo';

function errosDeCampo(error: ZodValidationException): ErroDeCampo[] {
  const { errors } = error.getResponse() as { errors?: unknown };

  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.flatMap((problema: unknown): ErroDeCampo[] => {
    if (typeof problema !== 'object' || problema === null) {
      return [];
    }

    const { path, message } = problema as { path?: unknown; message?: unknown };
    const campo = Array.isArray(path) ? path.map(String).join('.') : '';

    return typeof message === 'string'
      ? [{ campo: campo === '' ? CORPO_INTEIRO : campo, mensagem: message }]
      : [];
  });
}

/** O nome do status HTTP em inglês, como manda a RFC: `Not Found`, `Bad Request`. */
function statusTitle(status: number): string {
  const name = HttpStatus[status] as string | undefined;

  return name === undefined
    ? 'Error'
    : name
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

/** A mensagem da exceção, que na validação chega como lista de problemas. */
function exceptionDetail(error: HttpException): string {
  const response = error.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  const message = (response as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return message.map(String).join('; ');
  }

  return typeof message === 'string' ? message : error.message;
}
