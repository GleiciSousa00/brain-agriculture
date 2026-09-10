import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NOME_TAMANHO_MAXIMO } from '../../domain/produtor';

/**
 * O que se pode corrigir num Produtor: o nome, e nada mais.
 *
 * Não existe campo de Documento aqui de propósito. O Documento identifica o Produtor, e
 * trocá-lo seria cadastrar outro em vez de corrigir este. Ver o registro 0007.
 */
export const editarProdutorSchema = z.object({
  nome: z.string().trim().min(1).max(NOME_TAMANHO_MAXIMO).describe('Nome do Produtor.'),
});

export class EditarProdutorDto extends createZodDto(editarProdutorSchema) {}
