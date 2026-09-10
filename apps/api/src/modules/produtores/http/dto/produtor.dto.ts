import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

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
