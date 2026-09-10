import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const NOME_TAMANHO_MAXIMO = 100;

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
