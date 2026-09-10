import { describe, expect, it } from 'vitest';
import {
  corpoDaChamada,
  enderecoDaChamada,
  metodoDaChamada,
  respondaCom,
  respondaComProblema,
  respondaSemConteudo,
} from '../teste/fetch-falso';
import { excluirPlantio, listarPlantiosDaPropriedade, registrarPlantio } from './plantios';

const TRINCA = { propriedadeId: 'f1', culturaId: 'c1', safraId: 's1' };

describe('listarPlantiosDaPropriedade', () => {
  it('pede os Plantios pela rota da Propriedade', async () => {
    respondaCom({ itens: [], total: 0, pagina: 1, tamanho: 10 });

    await listarPlantiosDaPropriedade('f1', 1, 10);

    expect(enderecoDaChamada().pathname).toBe('/api/propriedades/f1/plantios');
    expect(enderecoDaChamada().searchParams.get('pagina')).toBe('1');
  });
});

describe('registrarPlantio', () => {
  it('manda a trinca no corpo', async () => {
    respondaCom({ id: 'pl1', ...TRINCA });

    await registrarPlantio(TRINCA);

    expect(metodoDaChamada()).toBe('POST');
    expect(enderecoDaChamada().pathname).toBe('/api/plantios');
    await expect(corpoDaChamada()).resolves.toEqual(TRINCA);
  });

  it('erra com o conflito da trinca repetida como a API o escreveu', async () => {
    respondaComProblema({
      status: 409,
      title: 'Conflict',
      detail: 'Essa Cultura já foi plantada nessa Propriedade nessa Safra.',
      codigo: 'PLANTIO_DUPLICADO',
    });

    await expect(registrarPlantio(TRINCA)).rejects.toMatchObject({
      message: 'Essa Cultura já foi plantada nessa Propriedade nessa Safra.',
      codigo: 'PLANTIO_DUPLICADO',
    });
  });
});

describe('excluirPlantio', () => {
  it('aceita o 204 sem corpo em vez de tratá-lo como falha', async () => {
    respondaSemConteudo();

    await expect(excluirPlantio('pl1')).resolves.toBeUndefined();
    expect(metodoDaChamada()).toBe('DELETE');
    expect(enderecoDaChamada().pathname).toBe('/api/plantios/pl1');
  });
});
