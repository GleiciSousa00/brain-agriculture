import { describe, expect, it } from 'vitest';
import { PAINEL_VAZIO } from '../teste/exemplos';
import {
  enderecoDaChamada,
  fetchFalso,
  respondaCom,
  respondaComProblema,
} from '../teste/fetch-falso';
import { ErroDaApi } from './chamada';
import { buscarPainel } from './painel';

describe('buscarPainel', () => {
  it('chama a rota do painel na própria origem, sem filtro', async () => {
    respondaCom(PAINEL_VAZIO);

    await buscarPainel();

    expect(enderecoDaChamada().pathname).toBe('/api/painel');
    expect(enderecoDaChamada().search).toBe('');
  });

  it('leva a Safra escolhida na consulta', async () => {
    respondaCom(PAINEL_VAZIO);

    await buscarPainel('a-safra');

    expect(enderecoDaChamada().search).toBe('?safraId=a-safra');
  });

  it('devolve os números como a API os mandou', async () => {
    respondaCom({ ...PAINEL_VAZIO, totais: { propriedades: 3, areaTotal: 12.5 } });

    await expect(buscarPainel()).resolves.toMatchObject({
      totais: { propriedades: 3, areaTotal: 12.5 },
    });
  });

  it('erra com o texto do corpo Problem Details, sem reescrevê-lo', async () => {
    respondaComProblema({
      status: 400,
      title: 'Bad Request',
      detail: 'O filtro de Safra não é um identificador válido.',
      codigo: 'FILTRO_INVALIDO',
    });

    await expect(buscarPainel('nada')).rejects.toMatchObject({
      message: 'O filtro de Safra não é um identificador válido.',
      codigo: 'FILTRO_INVALIDO',
    });
  });

  it('cai no título quando o problema vem sem detalhe', async () => {
    respondaComProblema({ status: 500, title: 'Internal Server Error' });

    await expect(buscarPainel()).rejects.toMatchObject({
      message: 'Internal Server Error',
    });
  });

  it('erra sem travar quando a resposta nem chega', async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(buscarPainel()).rejects.toBeInstanceOf(ErroDaApi);
  });
});
