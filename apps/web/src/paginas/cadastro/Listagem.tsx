import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { mensagemDe } from '../../api/chamada';
import type { Pagina } from '../../api/pagina';
import { PRIMEIRA_PAGINA, TAMANHO_DA_PAGINA, quantasPaginas } from '../../api/pagina';
import { Paginacao } from '../../componentes/Paginacao';
import { useCadastro } from './CadastroContexto';

interface Props<T> {
  /**
   * Busca uma fatia. O tamanho vem de quem lista, e não de quem chama.
   *
   * Trocar o que a função fecha não refaz a busca: o efeito depende de página e versão, não
   * dela. Para buscar de novo com uma chave nova, remonte o componente com `key`.
   */
  listar: (pagina: number, tamanho: number) => Promise<Pagina<T>>;
  /** O que a tela diz enquanto a primeira página não volta. */
  carregando: string;
  /** O que a tela diz quando não há registro nenhum. Tabela sem linha, não. */
  vazio: string;
  children: (itens: T[]) => ReactNode;
}

/**
 * Uma tabela paginada do cadastro, inteira.
 *
 * Ela é dona da página em que se está, da busca que a preenche e dos quatro estados em
 * que ela aparece. Os estados são exclusivos de propósito: falhou, e nada mais aparece;
 * está vindo; veio vazia; veio com linhas. As três seções que listam repetiam a mesma
 * cascata, e repetida ela divergia — a falha de uma delas deixava as linhas anteriores na
 * tela sob o aviso.
 *
 * `versao` é lida aqui, e não passada pelo chamador: é o número que o contexto sobe a
 * cada escrita, e esquecê-lo quebrava o refresh sem erro de tipo nenhum.
 */
export function Listagem<T>({ listar, carregando, vazio, children }: Props<T>) {
  const { versao } = useCadastro();
  const [pagina, setPagina] = useState(PRIMEIRA_PAGINA);
  const [conteudo, setConteudo] = useState<Pagina<T>>();
  const [erro, setErro] = useState<string>();

  const buscar = useRef(listar);

  useEffect(() => {
    buscar.current = listar;
  });

  useEffect(() => {
    let cancelado = false;
    setErro(undefined);

    buscar
      .current(pagina, TAMANHO_DA_PAGINA)
      .then((resposta) => {
        if (cancelado) {
          return;
        }

        if (resposta.itens.length === 0 && pagina > PRIMEIRA_PAGINA) {
          setPagina(pagina - 1);

          return;
        }

        setConteudo(resposta);
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          setConteudo(undefined);
          setErro(mensagemDe(causa));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [pagina, versao]);

  if (erro !== undefined) {
    return <p role="alert">{erro}</p>;
  }

  if (conteudo === undefined) {
    return <p role="status">{carregando}</p>;
  }

  if (conteudo.itens.length === 0) {
    return <p className="vazio">{vazio}</p>;
  }

  return (
    <>
      {children(conteudo.itens)}
      <Paginacao pagina={pagina} paginas={quantasPaginas(conteudo)} irPara={setPagina} />
    </>
  );
}
