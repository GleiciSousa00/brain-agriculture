import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ANO_MAXIMO, ANO_MINIMO } from '../../domain/safra';

/** O esquema confere a forma. A faixa de anos é regra, e quem responde é o domínio. */
export const criarSafraSchema = z.object({
  ano: z
    .number({ error: 'Informe o ano da Safra, com quatro dígitos.' })
    .int('O ano da Safra é um número inteiro.')
    .describe(`Ano do ciclo agrícola, entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`),
});

export class CriarSafraDto extends createZodDto(criarSafraSchema) {}
