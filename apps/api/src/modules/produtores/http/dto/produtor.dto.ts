import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginaSchema } from '../../../../shared/http/dto/pagina.dto';

/**
 * O que sai da API, montado a partir deste esquema e de mais nada.
 *
 * O Documento aparece mascarado, sempre. Não existe rota que devolva o valor completo, e
 * é por isso que a saída é explícita em vez de serializar a entidade: nada vaza por
 * esquecimento de anotar. Ver os registros 0002 e 0007.
 */
export const produtorSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  documento: z.string().describe('Mascarado. Os dois últimos grupos aparecem, o resto não.'),
  tipoDeDocumento: z.enum(['CPF', 'CNPJ']),
});

export type ProdutorResposta = z.infer<typeof produtorSchema>;

export class ProdutorDto extends createZodDto(produtorSchema) {}

/**
 * A Propriedade como o cadastro do Produtor a mostra.
 *
 * O esquema é declarado aqui, e não importado do módulo de Propriedade, porque a camada
 * `http` de um módulo não enxerga a de outro. Quem responde pelo formato desta resposta é
 * quem a devolve. Ver o registro 0005.
 */
export const propriedadeDoProdutorSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  cidade: z.string(),
  estado: z.string().describe('A sigla da unidade federativa.'),
  areaTotal: z.number().describe('Em hectares.'),
  areaAgricultavel: z.number().describe('Em hectares.'),
  areaDeVegetacao: z.number().describe('Em hectares.'),
});

/**
 * O cadastro inteiro: o Produtor e uma fatia das Propriedades em nome dele.
 *
 * As Propriedades vêm no mesmo invólucro de fatia de toda listagem da API, e não num vetor
 * solto, porque nada limita quantas um Produtor tem. Quem consome trata uma forma só.
 */
export const produtorDetalhadoSchema = produtorSchema.extend({
  propriedades: paginaSchema(propriedadeDoProdutorSchema),
});

export type ProdutorDetalhadoResposta = z.infer<typeof produtorDetalhadoSchema>;

export class ProdutorDetalhadoDto extends createZodDto(produtorDetalhadoSchema) {}

/** Uma fatia da listagem de Produtores, no mesmo formato de fatia de toda a API. */
export const produtoresPaginaSchema = paginaSchema(produtorSchema);

export type ProdutoresPaginaResposta = z.infer<typeof produtoresPaginaSchema>;

export class ProdutoresPaginaDto extends createZodDto(produtoresPaginaSchema) {}
