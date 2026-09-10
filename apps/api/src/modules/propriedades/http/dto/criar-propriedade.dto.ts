import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CIDADE_TAMANHO_MAXIMO, NOME_TAMANHO_MAXIMO } from '../../domain/propriedade';

/**
 * O esquema confere a forma, não a regra.
 *
 * Ele diz que as três áreas são números que não são negativos. Se a soma da Área
 * Agricultável com a Área de Vegetação cabe na Área Total, quem responde é a entidade
 * `Propriedade`. Ver o registro 0007.
 */
const areaSchema = z.number().nonnegative().describe('Em hectares, com até duas casas decimais.');

export const criarPropriedadeSchema = z.object({
  produtorId: z.uuid().describe('O Produtor em nome de quem a Propriedade é registrada.'),
  nome: z
    .string()
    .trim()
    .min(1)
    .max(NOME_TAMANHO_MAXIMO)
    .describe('Como quem opera encontra a Propriedade. Duas na mesma cidade se distinguem por ele.'),
  cidade: z.string().trim().min(1).max(CIDADE_TAMANHO_MAXIMO),
  estado: z.string().trim().length(2).describe('A sigla da unidade federativa.'),
  areaTotal: areaSchema,
  areaAgricultavel: areaSchema,
  areaDeVegetacao: areaSchema,
});

export class CriarPropriedadeDto extends createZodDto(criarPropriedadeSchema) {}

/** Editar troca o nome, a localização e as três áreas de uma vez. O Produtor não muda. */
export const editarPropriedadeSchema = criarPropriedadeSchema.omit({ produtorId: true });

export class EditarPropriedadeDto extends createZodDto(editarPropriedadeSchema) {}
