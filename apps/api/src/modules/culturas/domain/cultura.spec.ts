import { Cultura } from './cultura';
import { NomeDeCulturaInvalido } from './cultura.errors';

describe('Cultura', () => {
  it('nasce com identificador próprio e o nome informado', () => {
    const cultura = Cultura.criar({ nome: 'Soja' });

    expect(cultura.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(cultura.nome).toBe('Soja');
  });

  it('guarda o nome como foi digitado, com acento e caixa', () => {
    expect(Cultura.criar({ nome: 'Cana-de-açúcar' }).nome).toBe('Cana-de-açúcar');
  });

  it('descarta espaço em volta e espaço repetido no meio', () => {
    expect(Cultura.criar({ nome: '  Cana   de   açúcar  ' }).nome).toBe('Cana de açúcar');
  });

  it.each([
    ['vazio', ''],
    ['só espaço', '   '],
  ])('recusa nome %s', (_caso, nome) => {
    expect(() => Cultura.criar({ nome })).toThrow(NomeDeCulturaInvalido);
  });

  it('recusa nome longo demais', () => {
    expect(() => Cultura.criar({ nome: 'a'.repeat(101) })).toThrow(NomeDeCulturaInvalido);
  });

  describe('chave de comparação', () => {
    it.each([
      ['caixa diferente', 'CAFÉ'],
      ['sem acento', 'Cafe'],
      ['com espaço em volta', '  café  '],
    ])('trata %s como a mesma Cultura que "Café"', (_caso, nome) => {
      expect(Cultura.criar({ nome }).chave).toBe(Cultura.criar({ nome: 'Café' }).chave);
    });

    it('trata espécies diferentes como Culturas diferentes', () => {
      expect(Cultura.criar({ nome: 'Soja' }).chave).not.toBe(Cultura.criar({ nome: 'Milho' }).chave);
    });
  });

  it('reconstrói a Cultura que veio da persistência sem inventar identificador', () => {
    const cultura = Cultura.restaurar({
      id: '0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
      nome: 'Soja',
      chave: 'soja',
    });

    expect(cultura.id).toBe('0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b');
  });
});
