import { describe, expect, it } from 'vitest';
import {
  corpoDaChamada,
  enderecoDaChamada,
  metodoDaChamada,
  respondaCom,
  respondaComProblema,
  respondaSemConteudo,
  totalDeChamadas,
} from '../teste/fetch-falso';
import {
  buscarPropriedadesPorId,
  criarPropriedade,
  editarPropriedade,
  excluirPropriedade,
  listarPropriedades,
} from './propriedades';

const BOA_VISTA = {
  id: 'f1',
  produtorId: 'p1',
  nome: 'Fazenda Boa Vista',
  cidade: 'Uberaba',
  estado: 'MG',
  areaTotal: 100,
  areaAgricultavel: 60,
  areaDeVegetacao: 30,
};

describe('listarPropriedades', () => {
  it('leva a página e o tamanho na consulta', async () => {
    respondaCom({ itens: [BOA_VISTA], total: 1, pagina: 1, tamanho: 10 });

    await listarPropriedades(1, 10);

    expect(enderecoDaChamada().pathname).toBe('/api/propriedades');
    expect(enderecoDaChamada().searchParams.get('tamanho')).toBe('10');
  });
});

describe('buscarPropriedadesPorId', () => {
  it('pede os identificadores numa chamada só, com a página do tamanho da lista', async () => {
    respondaCom({ itens: [BOA_VISTA], total: 1, pagina: 1, tamanho: 2 });

    await buscarPropriedadesPorId(['f1', 'f2']);

    expect(enderecoDaChamada().pathname).toBe('/api/propriedades');
    expect(enderecoDaChamada().searchParams.getAll('ids')).toEqual(['f1', 'f2']);
    expect(enderecoDaChamada().searchParams.get('tamanho')).toBe('2');
  });

  it('não chama a API para pedido de nenhuma', async () => {
    await expect(buscarPropriedadesPorId([])).resolves.toEqual([]);
    expect(totalDeChamadas()).toBe(0);
  });
});

describe('criarPropriedade', () => {
  it('manda o Produtor, o nome, a localização e as três áreas', async () => {
    respondaCom(BOA_VISTA);

    const { id: _id, ...corpo } = BOA_VISTA;
    await criarPropriedade(corpo);

    expect(metodoDaChamada()).toBe('POST');
    await expect(corpoDaChamada()).resolves.toEqual(corpo);
  });

  it('erra com a recusa da soma das áreas como a API a escreveu', async () => {
    respondaComProblema({
      status: 400,
      title: 'Bad Request',
      detail: 'A soma da Área Agricultável com a Área de Vegetação passa da Área Total.',
      codigo: 'AREAS_NAO_FECHAM',
    });

    const { id: _id, ...corpo } = BOA_VISTA;

    await expect(criarPropriedade(corpo)).rejects.toMatchObject({
      message: 'A soma da Área Agricultável com a Área de Vegetação passa da Área Total.',
      codigo: 'AREAS_NAO_FECHAM',
    });
  });
});

describe('editarPropriedade', () => {
  it('atualiza pelo identificador, e o Produtor não vai no corpo', async () => {
    respondaCom(BOA_VISTA);

    const { id: _id, produtorId: _produtorId, ...corpo } = BOA_VISTA;
    await editarPropriedade('f1', corpo);

    expect(metodoDaChamada()).toBe('PUT');
    expect(enderecoDaChamada().pathname).toBe('/api/propriedades/f1');
    await expect(corpoDaChamada()).resolves.toEqual(corpo);
  });
});

describe('excluirPropriedade', () => {
  it('aceita o 204 sem corpo em vez de tratá-lo como falha', async () => {
    respondaSemConteudo();

    await expect(excluirPropriedade('f1')).resolves.toBeUndefined();
    expect(metodoDaChamada()).toBe('DELETE');
    expect(enderecoDaChamada().pathname).toBe('/api/propriedades/f1');
  });
});
