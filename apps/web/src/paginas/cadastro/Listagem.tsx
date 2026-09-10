import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { mensagemDe } from '../../api/chamada';
import type { Pagina } from '../../api/pagina';
import { PRIMEIRA_PAGINA, TAMANHO_DA_PAGINA, quantasPaginas } from '../../api/pagina';
import { Lista } from '../../componentes/Lista';
import { Paginacao } from '../../componentes/Paginacao';
import { formatarContagem } from '../../formato';
import { useCadastro } from './CadastroContexto';

interface Props<T> {
  /** O que a lista mostra, como "Produtores" ou "Propriedades de Ana Lima". */
  titulo: string;
  /** O que se pode fazer com a lista inteira, como abrir o formulário de registro. */
  acoes?: ReactNode;
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
 * Uma lista paginada do cadastro, inteira.
 *
 * Ela é dona da página em que se está, da busca que a preenche e dos quatro estados em
 * que ela aparece. Os estados são exclusivos de propósito: falhou, e nada mais aparece;
 * está vindo; veio vazia; veio com linhas. As três seções que listam repetiam a mesma
 * cascata, e repetida ela divergia — a falha de uma delas deixava as linhas anteriores na
 * tela sob o aviso.
 *
 * A contagem da faixa é o total que a API devolve na fatia, e não o que coube na página:
 * é a resposta a "quanto existe", e é por isso que ela mora aqui, junto de quem o recebe.
 *
 * `versao` é lida aqui, e não passada pelo chamador: é o número que o contexto sobe a
 * cada escrita, e esquecê-lo quebrava o refresh sem erro de tipo nenhum.
 */
export function Listagem<T>({ titulo, acoes, listar, carregando, vazio, children }: Props<T>) {
  const { versao } = useCadastro();
  const [pagina, setPagina] = useState(PRIMEIRA_PAGINA);
  const [conteudo, setConteudo] = useState<Pagina<T>>();
  const [erro, setErro] = useState<string>();

  // A busca mais recente fica guardada, e o efeito depende só de página e versão. É o que
  // permite ao chamador passar uma função inline: se o efeito dependesse dela, uma função
  // nova a cada renderização refaria a busca sem parar, e daí vinha o `useCallback` que
  // cada seção era obrigada a lembrar.
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
  }, [pagina, versao]);

  return (
    <Lista
      titulo={titulo}
      // Enquanto a fatia não volta não se sabe quanto existe, e um zero de espera seria
      // um número errado por alguns instantes.
      contagem={
        conteudo === undefined ? undefined : formatarContagem(conteudo.total, 'registro', 'registros')
      }
      acoes={acoes}
    >
      {erro !== undefined && <p role="alert">{erro}</p>}
      {erro === undefined && conteudo === undefined && (
        <p className="vazio" role="status">
          {carregando}
        </p>
      )}
      {conteudo !== undefined && conteudo.itens.length === 0 && <p className="vazio">{vazio}</p>}
      {conteudo !== undefined && conteudo.itens.length > 0 && (
        <>
          <div className="rolagem">{children(conteudo.itens)}</div>
          <Paginacao pagina={pagina} paginas={quantasPaginas(conteudo)} irPara={setPagina} />
        </>
      )}
    </Lista>
  );
}
