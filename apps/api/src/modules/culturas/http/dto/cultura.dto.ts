import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const culturaSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
});

export type CulturaResposta = z.infer<typeof culturaSchema>;

export class CulturaDto extends createZodDto(culturaSchema) {}

export class CulturasDto extends createZodDto(z.array(culturaSchema)) {}
