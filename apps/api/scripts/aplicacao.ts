import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

/**
 * Sobe a aplicação em processo, entrega para quem chamou, e derruba no fim.
 *
 * Os três comandos desta pasta usam isto em vez de falar com uma API já de pé. O ganho é
 * que eles precisam apenas do Postgres: a aplicação roda as migrações no arranque, então um
 * banco recém-criado fica pronto no mesmo comando.
 *
 * A aplicação não escuta porta nenhuma. Quem carrega dados fala com ela pelo servidor HTTP
 * em memória, que é o mesmo caminho que uma requisição de verdade percorre, com validação,
 * cifra e apresentador no meio.
 */
export async function comAplicacao<T>(usar: (app: INestApplication) => Promise<T>): Promise<T> {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  try {
    return await usar(app);
  } finally {
    await app.close();
  }
}

/**
 * Roda um comando e traduz a falha para código de saída.
 *
 * Sem isso uma promessa rejeitada derruba o processo com rastro de pilha e código zero em
 * algumas versões do Node, e a pipeline seguiria em frente com a carga pela metade.
 */
export function rodarComando(comando: () => Promise<void>): void {
  comando().catch((erro: unknown) => {
    process.exitCode = 1;
    console.error(erro instanceof Error ? erro.message : erro);
  });
}
