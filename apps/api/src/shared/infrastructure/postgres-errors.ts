import { QueryFailedError } from 'typeorm';

/** Código do Postgres para violação de restrição de unicidade. */
const UNICIDADE_VIOLADA = '23505';

/** Código do Postgres para violação de chave estrangeira. */
const CHAVE_ESTRANGEIRA_VIOLADA = '23503';

/**
 * Diz se a falha veio de uma restrição de unicidade do banco.
 *
 * Cada repositório traduz isso para o erro de domínio que faz sentido no módulo dele. O
 * que é comum é reconhecer o código, não decidir o que ele significa.
 */
export function violouUnicidade(erro: unknown): boolean {
  return codigoDe(erro) === UNICIDADE_VIOLADA;
}

/**
 * Diz se a falha veio de uma chave estrangeira.
 *
 * Vale nos dois sentidos: gravar apontando para uma linha que não existe, e apagar uma
 * linha que ainda é apontada. Quem sabe qual dos dois é, e o que dizer, é o repositório.
 */
export function violouChaveEstrangeira(erro: unknown): boolean {
  return codigoDe(erro) === CHAVE_ESTRANGEIRA_VIOLADA;
}

/**
 * O nome da restrição que a falha violou, quando o banco o informa.
 *
 * Três chaves estrangeiras na mesma tabela dão a mesma violação, e só o nome da restrição
 * diz qual delas foi. Reconhecer o nome é comum; decidir o que ele significa continua
 * sendo do repositório, que é quem batizou a restrição na migração.
 */
export function restricaoViolada(erro: unknown): string | undefined {
  return erro instanceof QueryFailedError
    ? (erro.driverError as { constraint?: string } | undefined)?.constraint
    : undefined;
}

function codigoDe(erro: unknown): string | undefined {
  return erro instanceof QueryFailedError
    ? (erro.driverError as { code?: string } | undefined)?.code
    : undefined;
}
