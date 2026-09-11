import { parametrosDeProdutoresSchema } from './listar-produtores.dto';

const UM = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OUTRO = '3f2504e0-4f89-41d3-9a0c-0305e82c3302';

/** O que a consulta traz é sempre texto, e repetido vira lista: a querystring é assim. */
function interpretar(consulta: Record<string, unknown>) {
  const { data, error } = parametrosDeProdutoresSchema.safeParse(consulta);

  return error === undefined ? data : error.issues.map(({ message }) => message).join('; ');
}

describe('os parâmetros da listagem de Produtores', () => {
  it('recorta pelos identificadores pedidos, com a página e o tamanho junto', () => {
    expect(interpretar({ ids: [UM, OUTRO], tamanho: '2' })).toEqual({
      ids: [UM, OUTRO],
      busca: undefined,
      pagina: 1,
      tamanho: 2,
    });
  });

  it('um identificador só chega como texto, e vira lista de um', () => {
    expect(interpretar({ ids: UM })).toMatchObject({ ids: [UM] });
  });

  it('sem identificador nenhum a listagem continua sendo a do cadastro inteiro', () => {
    expect(interpretar({})).toEqual({ ids: undefined, busca: undefined, pagina: 1, tamanho: 20 });
  });

  it('recusa o que não é identificador, em vez de procurar por um texto qualquer', () => {
    expect(interpretar({ ids: 'ana' })).toContain('UUID');
  });

  it('recusa em português mais identificadores do que cabem numa página', () => {
    expect(interpretar({ ids: Array.from({ length: 101 }, () => UM) })).toBe(
      'Não se pede mais de 100 identificadores.',
    );
  });
});
