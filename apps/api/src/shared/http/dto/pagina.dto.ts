import { createZodDto } from 'nestjs-zod';
import { z, type ZodType } from 'zod';

export const PAGINA_PADRAO = 1;
export const TAMANHO_PADRAO = 20;

/** Teto do que uma requisição pode pedir de uma vez, para a listagem não virar despejo. */
export const TAMANHO_MAXIMO = 100;

/**
 * Até onde a paginação vai fundo.
 *
 * Pular linhas custa: para entregar a página cinco mil, o banco percorre e descarta tudo o
 * que vem antes dela, e o custo cresce com a profundidade. Com o teto de tamanho acima, a
 * página mais funda começa no registro cinquenta mil, o que já é mais do que alguém lê.
 * Quem precisa do cadastro inteiro precisa de outra ferramenta, e não da página cinco mil.
 */
export const PAGINA_MAXIMA = 500;

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
    .max(PAGINA_MAXIMA)
    .default(PAGINA_PADRAO)
    .describe(`A página pedida. A primeira é a de número um, e a última é a ${PAGINA_MAXIMA}.`),
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

/** Até onde vai o que se digita no campo de busca. Passando disso, é outra ferramenta. */
export const BUSCA_TAMANHO_MAXIMO = 120;

/**
 * A página, mais o texto que a recorta.
 *
 * Só as listagens cujo campo de escolha precisa alcançar além da primeira página aceitam
 * busca: a de Produtor e a de Propriedade. Um campo em branco não é busca nenhuma, e por
 * isso o texto vazio some em vez de virar recorte que não casa com nada.
 */
export const parametrosDeBuscaSchema = parametrosDePaginaSchema.extend({
  busca: z
    .string()
    .trim()
    .max(BUSCA_TAMANHO_MAXIMO, `A busca não passa de ${String(BUSCA_TAMANHO_MAXIMO)} caracteres.`)
    .optional()
    .transform((texto) => (texto === '' ? undefined : texto))
    .describe('Pedaço do nome procurado. Ignora caixa e acento.'),
});

export class ParametrosDeBuscaDto extends createZodDto(parametrosDeBuscaSchema) {}
