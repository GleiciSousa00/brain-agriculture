import { describe, expect, it } from 'vitest';
import {
  corpoDaChamada,
  enderecoDaChamada,
  metodoDaChamada,
  respondaCom,
  respondaComProblema,
  respondaSemConteudo,
} from '../teste/fetch-falso';
import { criarProdutor, editarProdutor, excluirProdutor, listarProdutores } from './produtores';

const ANA = {
  id: 'p1',
  nome: 'Ana Lima',
  documento: '***.456.789-00',
  tipoDeDocumento: 'CPF' as const,
};

describe('listarProdutores', () => {
  it('leva a página e o tamanho na consulta', async () => {
    respondaCom({ itens: [ANA], total: 1, pagina: 2, tamanho: 10 });

    await listarProdutores(2, 10);

    expect(enderecoDaChamada().pathname).toBe('/api/produtores');
    expect(enderecoDaChamada().searchParams.get('pagina')).toBe('2');
    expect(enderecoDaChamada().searchParams.get('tamanho')).toBe('10');
  });

  it('devolve a fatia com o total do cadastro inteiro', async () => {
    respondaCom({ itens: [ANA], total: 68, pagina: 1, tamanho: 10 });

    await expect(listarProdutores(1, 10)).resolves.toMatchObject({ total: 68, itens: [ANA] });
  });
});

describe('criarProdutor', () => {
  it('manda nome e Documento no corpo', async () => {
    respondaCom(ANA);

    await criarProdutor({ nome: 'Ana Lima', documento: '123.456.789-00' });

    expect(metodoDaChamada()).toBe('POST');
    await expect(corpoDaChamada()).resolves.toEqual({
      nome: 'Ana Lima',
      documento: '123.456.789-00',
    });
  });

  it('erra com a recusa do Documento como a API a escreveu', async () => {
    respondaComProblema({
      status: 400,
      title: 'Bad Request',
      detail: 'O Documento informado não é um CPF nem um CNPJ válido.',
      codigo: 'DOCUMENTO_INVALIDO',
    });

    await expect(criarProdutor({ nome: 'Ana', documento: '111' })).rejects.toMatchObject({
      message: 'O Documento informado não é um CPF nem um CNPJ válido.',
      codigo: 'DOCUMENTO_INVALIDO',
    });
  });
});

describe('editarProdutor', () => {
  it('corrige o nome pelo identificador, sem tocar no Documento', async () => {
    respondaCom({ ...ANA, nome: 'Ana Maria Lima' });

    await editarProdutor('p1', { nome: 'Ana Maria Lima' });

    expect(metodoDaChamada()).toBe('PATCH');
    expect(enderecoDaChamada().pathname).toBe('/api/produtores/p1');
    await expect(corpoDaChamada()).resolves.toEqual({ nome: 'Ana Maria Lima' });
  });
});

describe('excluirProdutor', () => {
  it('aceita o 204 sem corpo em vez de tratá-lo como falha', async () => {
    respondaSemConteudo();

    await expect(excluirProdutor('p1')).resolves.toBeUndefined();
    expect(metodoDaChamada()).toBe('DELETE');
    expect(enderecoDaChamada().pathname).toBe('/api/produtores/p1');
  });

  it('erra quando o Produtor não existe mais', async () => {
    respondaComProblema({
      status: 404,
      title: 'Not Found',
      detail: 'Não existe Produtor com esse identificador.',
    });

    await expect(excluirProdutor('sumiu')).rejects.toMatchObject({
      message: 'Não existe Produtor com esse identificador.',
    });
  });
});
