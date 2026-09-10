import { useEffect, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import type { Pagina } from '../../api/pagina';
import { PRIMEIRA_PAGINA, quantasPaginas } from '../../api/pagina';

/** Uma tabela paginada, como a seção a mostra. */
export interface PaginaEmTela<T> {
  itens: T[];
  total: number;
  pagina: number;
  paginas: number;
  irPara: (pagina: number) => void;
  carregando: boolean;
  erro?: string;
}

/**
 * A página que uma tabela do cadastro mostra.
 *
 * `buscar` precisa ser estável entre renderizações, com `useCallback`, senão o efeito
 * dispara sem parar. `versao` vem do contexto e é o que refaz a tabela depois de uma
 * escrita feita noutro lugar da tela.
 */
export function usePagina<T>(
  buscar: (pagina: number) => Promise<Pagina<T>>,
  versao: number,
): PaginaEmTela<T> {
  const [pagina, setPagina] = useState(PRIMEIRA_PAGINA);
  const [conteudo, setConteudo] = useState<Pagina<T>>();
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    let cancelado = false;
    setErro(undefined);

    buscar(pagina)
      .then((resposta) => {
        if (cancelado) {
          return;
        }

        // Excluir o último registro de uma página deixa quem opera numa página que não
        // existe mais. Voltar uma é melhor do que mostrar tabela vazia sob "página 3 de 2".
        if (resposta.itens.length === 0 && pagina > PRIMEIRA_PAGINA) {
          setPagina(pagina - 1);

          return;
        }

        setConteudo(resposta);
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          // A tabela sai da tela junto com a falha. Deixar as linhas anteriores sob um
          // aviso de erro seria mostrar um dado e dizer que ele é outro.
          setConteudo(undefined);
          setErro(mensagemDe(causa));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [buscar, pagina, versao]);

  return {
    itens: conteudo?.itens ?? [],
    total: conteudo?.total ?? 0,
    pagina,
    paginas: conteudo === undefined ? 1 : quantasPaginas(conteudo),
    irPara: setPagina,
    carregando: conteudo === undefined && erro === undefined,
    erro,
  };
}
