/**
 * A natureza da falha, dita em vocabulário de domínio.
 *
 * O domínio não sabe o que é status HTTP, e não pode saber: é a camada `http` que traduz
 * cada natureza para um código. Sem isso a tradução viraria comparação de mensagem.
 */
export type NaturezaDaFalha = 'entrada-invalida' | 'conflito' | 'nao-encontrado';

/** Erro de regra de negócio. */
export abstract class DomainError extends Error {
  /** Identifica o erro para quem consome a API, sem depender do texto da mensagem. */
  abstract readonly codigo: string;

  abstract readonly natureza: NaturezaDaFalha;

  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}
