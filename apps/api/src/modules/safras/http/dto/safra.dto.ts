import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const safraSchema = z.object({
  id: z.uuid(),
  ano: z.number().int(),
});

export type SafraResposta = z.infer<typeof safraSchema>;

export class SafraDto extends createZodDto(safraSchema) {}

export class SafrasDto extends createZodDto(z.array(safraSchema)) {}
