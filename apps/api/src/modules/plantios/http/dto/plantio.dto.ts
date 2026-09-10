import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginaSchema } from '../../../../shared/http/dto/pagina.dto';

/** O que sai da API. O Plantio é a ligação, e é isso que ele mostra. */
export const plantioSchema = z.object({
  id: z.uuid(),
  propriedadeId: z.uuid(),
  culturaId: z.uuid(),
  safraId: z.uuid(),
});

export type PlantioResposta = z.infer<typeof plantioSchema>;

export class PlantioDto extends createZodDto(plantioSchema) {}

export const plantiosPaginaSchema = paginaSchema(plantioSchema);

export type PlantiosPaginaResposta = z.infer<typeof plantiosPaginaSchema>;

export class PlantiosPaginaDto extends createZodDto(plantiosPaginaSchema) {}
