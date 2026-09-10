import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/** A rota onde a especificação fica navegável. */
export const OPENAPI_PATH = 'docs';

/**
 * Monta a especificação a partir dos decoradores.
 *
 * `cleanupOpenApiDoc` é do `nestjs-zod` e resolve os esquemas Zod em esquemas do OpenAPI,
 * para que a especificação descreva o que o pipe realmente aceita.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Cadastro Rural')
    .setDescription(
      'Cadastro de Produtores, Propriedades, Safras, Culturas e Plantios. Toda falha sai no formato Problem Details da RFC 9457.',
    )
    .setVersion('0.1.0')
    .build();

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}
