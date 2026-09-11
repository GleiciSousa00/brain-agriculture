import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { PROBLEM_DETAILS_CONTENT_TYPE } from '../shared/http/problem-details';

/** A rota onde a especificação fica navegável. */
export const OPENAPI_PATH = 'docs';

const PROBLEM_DETAILS_REF = '#/components/schemas/ProblemDetailsDto';

const RECUSA_DE_ENTRADA =
  'A entrada não passou pelo esquema: o campo recusado e o motivo vêm em `erros`.';

const FALHA_INTERNA = 'A requisição não pôde ser concluída. O rastro fica no log, pelo `correlationId`.';

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

  return declararRespostasDeErro(cleanupOpenApiDoc(SwaggerModule.createDocument(app, config)));
}

type Operacao = NonNullable<OpenAPIObject['paths'][string]['get']>;

/**
 * Completa a especificação com as falhas que toda rota devolve.
 *
 * Elas não estão nos decoradores porque não são escolha de rota nenhuma: quem tem
 * parâmetro ou corpo recusa entrada inválida, e qualquer rota pode falhar por dentro. O
 * cliente do pacote de contratos é gerado daqui, e o que não é declarado chega a quem
 * integra como `never`, que foi o que motivou publicar o formato de erro.
 */
function declararRespostasDeErro(documento: OpenAPIObject): OpenAPIObject {
  for (const caminho of Object.values(documento.paths)) {
    for (const operacao of Object.values(caminho) as Operacao[]) {
      if (typeof operacao !== 'object' || !('responses' in operacao)) {
        continue;
      }

      corrigirTipoDeConteudo(operacao);

      if (temEntrada(operacao)) {
        acrescentar(operacao, '400', RECUSA_DE_ENTRADA);
      }

      acrescentar(operacao, '500', FALHA_INTERNA);
    }
  }

  return documento;
}

/** Rota com parâmetro ou corpo é rota que pode recusar a entrada. */
function temEntrada(operacao: Operacao): boolean {
  return (operacao.parameters ?? []).length > 0 || operacao.requestBody !== undefined;
}

function acrescentar(operacao: Operacao, status: string, description: string): void {
  operacao.responses[status] ??= {
    description,
    content: { [PROBLEM_DETAILS_CONTENT_TYPE]: { schema: { $ref: PROBLEM_DETAILS_REF } } },
  };
}

/**
 * A falha sai em `application/problem+json`, e não em `application/json`.
 *
 * O decorador do Swagger não pergunta o tipo de conteúdo, então quem o declara é o filtro
 * — e a especificação tem de dizer o mesmo que o servidor manda.
 */
function corrigirTipoDeConteudo(operacao: Operacao): void {
  for (const [status, resposta] of Object.entries(operacao.responses)) {
    const conteudo = (resposta as { content?: Record<string, unknown> }).content;

    if (Number(status) < 400 || conteudo?.['application/json'] === undefined) {
      continue;
    }

    conteudo[PROBLEM_DETAILS_CONTENT_TYPE] = conteudo['application/json'];
    delete conteudo['application/json'];
  }
}
