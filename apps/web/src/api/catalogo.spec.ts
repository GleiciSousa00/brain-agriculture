import { describe, expect, it } from 'vitest';
import {
  corpoDaChamada,
  enderecoDaChamada,
  metodoDaChamada,
  respondaCom,
  respondaComProblema,
} from '../teste/fetch-falso';
import { acrescentarCultura, criarSafra, listarCulturas, listarSafras } from './catalogo';

describe('o catálogo de Culturas', () => {
  it('devolve a lista como a API a mandou', async () => {
    respondaCom([{ id: 'c1', nome: 'Soja' }]);

    await expect(listarCulturas()).resolves.toEqual([{ id: 'c1', nome: 'Soja' }]);
    expect(enderecoDaChamada().pathname).toBe('/api/culturas');
  });

  it('acrescenta a espécie pelo corpo do pedido', async () => {
    respondaCom({ id: 'c2', nome: 'Milho' });

    await acrescentarCultura({ nome: 'Milho' });

    expect(metodoDaChamada()).toBe('POST');
    expect(enderecoDaChamada().pathname).toBe('/api/culturas');
    await expect(corpoDaChamada()).resolves.toEqual({ nome: 'Milho' });
  });

  it('erra com o texto do corpo Problem Details, sem reescrevê-lo', async () => {
    respondaComProblema({
      status: 409,
      title: 'Conflict',
      detail: 'Já existe uma Cultura com esse nome.',
      codigo: 'CULTURA_DUPLICADA',
    });

    await expect(acrescentarCultura({ nome: 'Soja' })).rejects.toMatchObject({
      message: 'Já existe uma Cultura com esse nome.',
      codigo: 'CULTURA_DUPLICADA',
    });
  });
});

describe('o catálogo de Safras', () => {
  it('devolve a lista como a API a mandou', async () => {
    respondaCom([{ id: 'uma', ano: 2025 }]);

    await expect(listarSafras()).resolves.toEqual([{ id: 'uma', ano: 2025 }]);
    expect(enderecoDaChamada().pathname).toBe('/api/safras');
  });

  it('registra a Safra pelo ano', async () => {
    respondaCom({ id: 'nova', ano: 2026 });

    await criarSafra({ ano: 2026 });

    expect(metodoDaChamada()).toBe('POST');
    await expect(corpoDaChamada()).resolves.toEqual({ ano: 2026 });
  });
});
