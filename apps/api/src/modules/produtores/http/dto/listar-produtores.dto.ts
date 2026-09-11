import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TAMANHO_MAXIMO, parametrosDeBuscaSchema } from '../../../../shared/http/dto/pagina.dto';

/**
 * Os parâmetros da listagem de Produtores: a página, a busca e um punhado de identificadores.
 *
 * O recorte por identificador serve a quem já tem os identificadores em mãos e precisa dos
 * nomes, conforme o registro de decisão 0012.
 *
 * O teto de quantos identificadores cabem é o mesmo teto de tamanho de página: quem pede
 * nomes está resolvendo uma página, e uma página não passa disso. Os dois andam juntos —
 * pedir cem identificadores numa página de vinte devolve vinte.
 */
export const parametrosDeProdutoresSchema = parametrosDeBuscaSchema.extend({
  ids: z
    .preprocess(
      // Um `ids` só chega como texto, e vários chegam como lista. Quem consome o esquema
      // trata uma forma só.
      (valor) => (valor === undefined || Array.isArray(valor) ? valor : [valor]),
      z
        .array(z.uuid())
        .max(TAMANHO_MAXIMO, `Não se pede mais de ${String(TAMANHO_MAXIMO)} identificadores.`),
    )
    .optional()
    .describe('Recorta a listagem a estes Produtores. Ausente, lista todos.'),
});

export class ParametrosDeProdutoresDto extends createZodDto(parametrosDeProdutoresSchema) {}
