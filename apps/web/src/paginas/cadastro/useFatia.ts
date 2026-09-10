import { useEffect, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import type { Fatia } from '../../api/pagina';
import { PRIMEIRA_PAGINA, quantasPaginas } from '../../api/pagina';

/** Uma tabela paginada, como a seção a mostra. */
export interface FatiaEmTela<T> {
  itens: T[];
  total: number;
  pagina: number;
  paginas: number;
  irPara: (pagina: number) => void;
  carregando: boolean;
  erro?: string;
}

/**
 * A fatia que uma tabela do cadastro mostra.
 *
 * `buscar` precisa ser estável entre renderizações, com `useCallback`, senão o efeito
 * dispara sem parar. `versao` vem do contexto e é o que refaz a tabela depois de uma
 * escrita feita noutro lugar da tela.
 */
export function useFatia<T>(
  buscar: (pagina: number) => Promise<Fatia<T>>,
  versao: number,
): FatiaEmTela<T> {
  const [pagina, setPagina] = useState(PRIMEIRA_PAGINA);
  const [fatia, setFatia] = useState<Fatia<T>>();
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
        if (resposta.itens.length === 0 && resposta.pagina > PRIMEIRA_PAGINA) {
          setPagina(resposta.pagina - 1);

          return;
        }

        setFatia(resposta);
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          setErro(mensagemDe(causa));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [buscar, pagina, versao]);

  return {
    itens: fatia?.itens ?? [],
    total: fatia?.total ?? 0,
    pagina,
    paginas: fatia === undefined ? 1 : quantasPaginas(fatia),
    irPara: setPagina,
    carregando: fatia === undefined && erro === undefined,
    erro,
  };
}
