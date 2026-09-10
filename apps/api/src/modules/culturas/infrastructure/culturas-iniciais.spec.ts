import { CULTURAS_INICIAIS, linhasIniciais } from './culturas-iniciais';
import { Cultura } from '../domain/cultura';

describe('carga inicial do catálogo', () => {
  it('traz as espécies mais comuns', () => {
    expect(CULTURAS_INICIAIS).toEqual(
      expect.arrayContaining(['Soja', 'Milho', 'Café', 'Cana-de-açúcar', 'Algodão']),
    );
  });

  it('não repete espécie, nem por acento ou caixa', () => {
    const chaves = linhasIniciais().map((linha) => linha.chave);

    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('calcula a chave pela mesma regra que a Cultura usa', () => {
    for (const { nome, chave } of linhasIniciais()) {
      expect(chave).toBe(Cultura.criar({ nome }).chave);
    }
  });
});
