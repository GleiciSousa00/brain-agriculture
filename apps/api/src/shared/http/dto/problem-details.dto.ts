import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * O formato único de erro, publicado na especificação.
 *
 * Ele está aqui, e não só no filtro, para que o cliente gerado a partir do OpenAPI saiba
 * tipar a falha. Sem isso quem integra recebe `never` no lugar do corpo do erro.
 */
export const problemDetailsSchema = z.object({
  type: z.string().describe('URI que identifica o tipo do problema.'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional().describe('A URI que sofreu a falha.'),
  correlationId: z.string().optional().describe('Liga a resposta às linhas de log da requisição.'),
  codigo: z
    .string()
    .optional()
    .describe('Código do erro de regra de negócio, quando a falha veio do domínio.'),
  erros: z
    .array(
      z.object({
        campo: z.string().describe('O caminho do campo recusado, como `areaTotal`.'),
        mensagem: z.string(),
      }),
    )
    .optional()
    .describe('Os campos recusados pelo esquema de entrada. Só existe na recusa de esquema.'),
});

export class ProblemDetailsDto extends createZodDto(problemDetailsSchema) {}
