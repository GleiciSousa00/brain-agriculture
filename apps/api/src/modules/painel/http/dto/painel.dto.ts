import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * O filtro da consulta.
 *
 * Ele tem uma dimensão só, e de propósito: a Safra recorta apenas a distribuição por
 * Cultura. Ver a decisão do painel na issue 2.
 */
export const filtroDoPainelSchema = z.object({
  safraId: z
    .uuid()
    .optional()
    .describe('Recorta apenas a distribuição por Cultura. Sem ele, ela cobre todas as Safras.'),
});

export class FiltroDoPainelDto extends createZodDto(filtroDoPainelSchema) {}

const hectares = (descricao: string) => z.number().describe(`${descricao} Em hectares.`);

/** O que sai da API. Nada sai por padrão: o esquema é a lista do que a gestora vê. */
export const painelSchema = z.object({
  totais: z.object({
    propriedades: z.number().int().describe('Quantas Propriedades existem no cadastro.'),
    areaTotal: hectares('A soma da Área Total das Propriedades.'),
  }),
  usoDoSolo: z.object({
    areaAgricultavel: hectares('A soma da Área Agricultável.'),
    areaDeVegetacao: hectares('A soma da Área de Vegetação.'),
  }),
  propriedadesPorEstado: z.array(
    z.object({
      estado: z.string().length(2).describe('A sigla da unidade federativa.'),
      propriedades: z.number().int(),
    }),
  ),
  plantiosPorCultura: z.array(
    z.object({
      culturaId: z.uuid(),
      cultura: z.string().describe('O nome da Cultura, como está no catálogo.'),
      plantios: z.number().int(),
    }),
  ),
});

export type PainelResposta = z.infer<typeof painelSchema>;

export class PainelDto extends createZodDto(painelSchema) {}
