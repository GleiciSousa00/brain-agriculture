import type { ReactNode } from 'react';

/** O nome do produto, que fecha o título de toda aba. */
const PRODUTO = 'Cadastro Rural';

interface Props {
  /** Como a tela se chama na navegação, como "Painel" ou "Produtores". */
  nome: string;
  children: ReactNode;
}

/**
 * Uma tela, e o título de aba que ela carrega.
 *
 * Sem isto toda rota se chama "Cadastro Rural", e quem trabalha com o painel e o cadastro
 * lado a lado não distingue as duas abas nem acha a certa no histórico.
 *
 * O React 19 leva a etiqueta para o `head` sozinho, de onde quer que ela seja desenhada,
 * então o título é o que a rota devolve e desaparece com ela. Quem envolve é a rota, e
 * não a página, porque a página tem saída antecipada enquanto carrega e a aba precisa ter
 * nome já aí.
 */
export function Tela({ nome, children }: Props) {
  return (
    <>
      <title>{`${nome} · ${PRODUTO}`}</title>
      {children}
    </>
  );
}
