import { parametrosDeBuscaSchema } from './pagina.dto';

/** O que a consulta traz é sempre texto: a querystring não tem número nem ausência. */
function interpretar(consulta: Record<string, string>) {
  const { data, error } = parametrosDeBuscaSchema.safeParse(consulta);

  return error === undefined ? data : error.issues.map(({ message }) => message).join('; ');
}

describe('os parâmetros de busca', () => {
  it('traz o termo digitado junto da página', () => {
    expect(interpretar({ busca: 'boa vista', pagina: '2', tamanho: '10' })).toEqual({
      busca: 'boa vista',
      pagina: 2,
      tamanho: 10,
    });
  });

  it('campo em branco não é busca, e some em vez de virar recorte que não casa com nada', () => {
    expect(interpretar({ busca: '   ' })).toEqual({ busca: undefined, pagina: 1, tamanho: 20 });
  });

  it('a listagem sem busca continua valendo, com os mesmos valores padrão', () => {
    expect(interpretar({})).toEqual({ busca: undefined, pagina: 1, tamanho: 20 });
  });

  it('recusa em português o termo que passa do teto', () => {
    expect(interpretar({ busca: 'a'.repeat(121) })).toBe('A busca não passa de 120 caracteres.');
  });
});
