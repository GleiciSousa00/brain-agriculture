import { QueryFailedError } from 'typeorm';

/** Código do Postgres para violação de restrição de unicidade. */
const UNICIDADE_VIOLADA = '23505';

/**
 * Diz se a falha veio de uma restrição de unicidade do banco.
 *
 * Cada repositório traduz isso para o erro de domínio que faz sentido no módulo dele. O
 * que é comum é reconhecer o código, não decidir o que ele significa.
 */
export function violouUnicidade(erro: unknown): boolean {
  return (
    erro instanceof QueryFailedError &&
    (erro.driverError as { code?: string } | undefined)?.code === UNICIDADE_VIOLADA
  );
}
