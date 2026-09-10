import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginaSchema } from '../../../../shared/http/dto/pagina.dto';

/** O que sai da API. As áreas saem em hectares, que é a unidade do cadastro. */
export const propriedadeSchema = z.object({
  id: z.uuid(),
  produtorId: z.uuid(),
  nome: z.string(),
  cidade: z.string(),
  estado: z.string().describe('A sigla da unidade federativa.'),
  areaTotal: z.number().describe('Em hectares.'),
  areaAgricultavel: z.number().describe('Em hectares.'),
  areaDeVegetacao: z.number().describe('Em hectares.'),
});

export type PropriedadeResposta = z.infer<typeof propriedadeSchema>;

export class PropriedadeDto extends createZodDto(propriedadeSchema) {}

export const propriedadesPaginaSchema = paginaSchema(propriedadeSchema);

export type PropriedadesPaginaResposta = z.infer<typeof propriedadesPaginaSchema>;

export class PropriedadesPaginaDto extends createZodDto(propriedadesPaginaSchema) {}
