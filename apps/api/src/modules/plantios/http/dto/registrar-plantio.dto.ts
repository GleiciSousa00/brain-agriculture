import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * O esquema confere a forma, não a existência.
 *
 * Ele diz que os três identificadores são UUID. Se a Cultura, a Propriedade e a Safra
 * existem, quem responde é a chave estrangeira, na gravação. Ver o registro 0007.
 */
export const registrarPlantioSchema = z.object({
  propriedadeId: z.uuid().describe('A Propriedade onde se plantou.'),
  culturaId: z.uuid().describe('A Cultura do catálogo que foi plantada.'),
  safraId: z.uuid().describe('A Safra em que se plantou.'),
});

export class RegistrarPlantioDto extends createZodDto(registrarPlantioSchema) {}
