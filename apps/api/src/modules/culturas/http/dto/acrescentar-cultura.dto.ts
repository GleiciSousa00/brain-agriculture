import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NOME_TAMANHO_MAXIMO } from '../../domain/cultura';

/** O esquema confere a forma. Se a espécie já está no catálogo, quem responde é o domínio. */
export const acrescentarCulturaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1)
    .max(NOME_TAMANHO_MAXIMO)
    .describe('Nome da espécie, como Soja, Milho ou Café.'),
});

export class AcrescentarCulturaDto extends createZodDto(acrescentarCulturaSchema) {}
