import { PAGINA_MAXIMA, TAMANHO_MAXIMO, parametrosDePaginaSchema } from './pagina.dto';

describe('parametrosDePaginaSchema', () => {
  it('assume a primeira página e o tamanho padrão quando nada é pedido', () => {
    expect(parametrosDePaginaSchema.parse({})).toEqual({ pagina: 1, tamanho: 20 });
  });

  it('aceita número escrito como texto, que é como ele chega na consulta', () => {
    expect(parametrosDePaginaSchema.parse({ pagina: '3', tamanho: '50' })).toEqual({
      pagina: 3,
      tamanho: 50,
    });
  });

  it('recusa pedir mais registros do que o teto de uma vez', () => {
    expect(() => parametrosDePaginaSchema.parse({ tamanho: TAMANHO_MAXIMO + 1 })).toThrow();
  });

  /**
   * O teto de profundidade é o que impede a listagem de virar varredura: pular linhas custa,
   * e o custo cresce com a profundidade. Sem ele, uma requisição pede a página um milhão e o
   * banco percorre e descarta tudo o que vem antes dela.
   */
  it('recusa página mais funda do que o teto', () => {
    expect(() => parametrosDePaginaSchema.parse({ pagina: PAGINA_MAXIMA + 1 })).toThrow();
    expect(parametrosDePaginaSchema.parse({ pagina: PAGINA_MAXIMA }).pagina).toBe(PAGINA_MAXIMA);
  });

  it('recusa página zero, porque a primeira é a de número um', () => {
    expect(() => parametrosDePaginaSchema.parse({ pagina: 0 })).toThrow();
  });
});
