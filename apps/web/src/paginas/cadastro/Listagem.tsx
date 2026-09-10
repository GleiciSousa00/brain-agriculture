import type { ReactNode } from 'react';
import { Paginacao } from '../../componentes/Paginacao';
import type { PaginaEmTela } from './usePagina';

interface Props<T> {
  pagina: PaginaEmTela<T>;
  /** O que a tela diz enquanto a primeira página não volta. */
  carregando: string;
  /** O que a tela diz quando não há registro nenhum. Tabela sem linha, não. */
  vazio: string;
  children: (itens: T[]) => ReactNode;
}

/**
 * Os quatro estados de uma tabela paginada, num lugar só.
 *
 * São exclusivos de propósito: falhou, e nada mais aparece; está vindo; veio vazia; veio
 * com linhas. As três seções que listam repetiam a mesma cascata, e repetida ela
 * divergia — a falha de uma delas deixava as linhas anteriores na tela sob o aviso.
 */
export function Listagem<T>({ pagina, carregando, vazio, children }: Props<T>) {
  if (pagina.erro !== undefined) {
    return <p role="alert">{pagina.erro}</p>;
  }

  if (pagina.carregando) {
    return <p role="status">{carregando}</p>;
  }

  if (pagina.itens.length === 0) {
    return <p className="vazio">{vazio}</p>;
  }

  return (
    <>
      {children(pagina.itens)}
      <Paginacao pagina={pagina.pagina} paginas={pagina.paginas} irPara={pagina.irPara} />
    </>
  );
}
