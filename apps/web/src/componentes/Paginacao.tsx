interface Props {
  pagina: number;
  paginas: number;
  irPara: (pagina: number) => void;
}

/**
 * Anterior, próxima, e onde a operadora está.
 *
 * O número de páginas vem do total que a API devolve na fatia, e não do que coube na
 * tela: esconder o tamanho da base seria mentir sobre o que existe.
 */
export function Paginacao({ pagina, paginas, irPara }: Props) {
  if (paginas <= 1) {
    return null;
  }

  return (
    <p className="paginacao">
      <button type="button" disabled={pagina <= 1} onClick={() => { irPara(pagina - 1); }}>
        Anterior
      </button>
      <span aria-live="polite">
        página {pagina} de {paginas}
      </span>
      <button type="button" disabled={pagina >= paginas} onClick={() => { irPara(pagina + 1); }}>
        Próxima
      </button>
    </p>
  );
}
