import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NOME_TAMANHO_MAXIMO } from '../../domain/produtor';

/** Onze caracteres num CPF sem máscara, dezoito num CNPJ com máscara. */
const DOCUMENTO_TAMANHO_MINIMO = 11;
const DOCUMENTO_TAMANHO_MAXIMO = 18;

/**
 * O esquema confere a forma, não a regra.
 *
 * Ele diz que o campo é texto de tamanho aceitável. Se o dígito verificador fecha, quem
 * responde é o objeto de valor no domínio. Ver o registro 0007.
 */
export const criarProdutorSchema = z.object({
  documento: z
    .string()
    .trim()
    .min(DOCUMENTO_TAMANHO_MINIMO, 'Informe o Documento: onze caracteres no CPF, catorze no CNPJ.')
    .max(DOCUMENTO_TAMANHO_MAXIMO, 'O Documento passou do tamanho de um CNPJ com máscara.')
    .describe('CPF ou CNPJ, com ou sem máscara. Letra minúscula é recusada.'),
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome do Produtor.')
    .max(NOME_TAMANHO_MAXIMO, `O nome do Produtor não passa de ${String(NOME_TAMANHO_MAXIMO)} caracteres.`)
    .describe('Nome do Produtor.'),
});

export class CriarProdutorDto extends createZodDto(criarProdutorSchema) {}
