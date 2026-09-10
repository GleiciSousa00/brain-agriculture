import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { documentoOpenApi } from './config/openapi';

const DESTINO = resolve(__dirname, '..', 'openapi.json');

/**
 * Escreve a especificação versionada.
 *
 * O modo de pré-visualização do Nest monta o grafo de módulos sem instanciar provedor
 * nenhum, então isso roda sem banco de pé e sem segredo de cifra configurado.
 */
async function gerar(): Promise<void> {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  const documento = documentoOpenApi(app);

  writeFileSync(DESTINO, `${JSON.stringify(documento, null, 2)}\n`, 'utf8');
  await app.close();

  process.stdout.write(`especificação escrita em ${DESTINO}\n`);
}

void gerar();
