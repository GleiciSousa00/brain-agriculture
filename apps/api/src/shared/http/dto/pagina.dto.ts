import { createZodDto } from 'nestjs-zod';
import { z, type ZodType } from 'zod';

export const PAGINA_PADRAO = 1;
export const TAMANHO_PADRAO = 20;

/** Teto do que uma requisição pode pedir de uma vez, para a listagem não virar despejo. */
export const TAMANHO_MAXIMO = 100;

/**
 * Os parâmetros de paginação, iguais em toda listagem da API.
 *
 * O esquema confere a forma e aplica os valores padrão. Ele não sabe quantos registros
 * existem: quem responde por isso é o repositório. Ver o registro 0007.
 */
export const parametrosDePaginaSchema = z.object({
  pagina: z.coerce
    .number()
    .int()
    .min(1)
    .default(PAGINA_PADRAO)
    .describe('A página pedida. A primeira é a de número um.'),
  tamanho: z.coerce
    .number()
    .int()
    .min(1)
    .max(TAMANHO_MAXIMO)
    .default(TAMANHO_PADRAO)
    .describe(`Quantos registros por página, no máximo ${TAMANHO_MAXIMO}.`),
});

export class ParametrosDePaginaDto extends createZodDto(parametrosDePaginaSchema) {}

/** Envolve o esquema de um item no formato único de fatia que toda listagem devolve. */
export function paginaSchema<T extends ZodType>(itemSchema: T) {
  return z.object({
    itens: z.array(itemSchema),
    total: z.number().int().describe('Quantos registros existem ao todo.'),
    pagina: z.number().int(),
    tamanho: z.number().int(),
  });
}
