import { z } from 'zod';

/**
 * Põe o Zod para recusar em português.
 *
 * Sem isto o texto cru da biblioteca chega à tela: "Too small: expected string to have
 * >=11 characters" num aplicativo escrito inteiro em português. A recusa de esquema é a
 * única que falava inglês — as regras de negócio já respondem em português desde sempre.
 *
 * É um módulo de efeito, importado por `AppModule`, porque a configuração é global do
 * Zod e precisa valer antes da primeira validação, venha ela do servidor, de um teste de
 * integração ou do gerador de OpenAPI.
 */
z.config(z.locales.ptBR());
