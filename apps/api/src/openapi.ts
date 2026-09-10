import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './config/openapi';

const DESTINATION = resolve(__dirname, '..', 'openapi.json');

/**
 * Escreve a especificação versionada.
 *
 * O modo de pré-visualização do Nest monta o grafo de módulos sem instanciar provedor
 * nenhum, então isso roda sem banco de pé e sem segredo de cifra configurado.
 */
async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  const document = buildOpenApiDocument(app);

  writeFileSync(DESTINATION, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();

  process.stdout.write(`especificação escrita em ${DESTINATION}\n`);
}

void generate();
