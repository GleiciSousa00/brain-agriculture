import { Documento } from './documento';
import { NomeDeProdutorInvalido } from './produtor.errors';
import { Produtor } from './produtor';

const DOCUMENTO = Documento.criar('529.982.247-25');

describe('Produtor', () => {
  it('nasce com identificador próprio', () => {
    const produtor = Produtor.criar({ documento: DOCUMENTO, nome: 'Maria da Silva' });

    expect(produtor.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('guarda o Documento e o nome informados', () => {
    const produtor = Produtor.criar({ documento: DOCUMENTO, nome: 'Maria da Silva' });

    expect(produtor.documento.igualA(DOCUMENTO)).toBe(true);
    expect(produtor.nome).toBe('Maria da Silva');
  });

  it('descarta espaço em volta do nome', () => {
    const produtor = Produtor.criar({ documento: DOCUMENTO, nome: '  Maria da Silva  ' });

    expect(produtor.nome).toBe('Maria da Silva');
  });

  it.each([
    ['vazio', ''],
    ['só espaço', '   '],
  ])('recusa nome %s', (_caso, nome) => {
    expect(() => Produtor.criar({ documento: DOCUMENTO, nome })).toThrow(NomeDeProdutorInvalido);
  });

  it('recusa nome longo demais', () => {
    const nome = 'a'.repeat(201);

    expect(() => Produtor.criar({ documento: DOCUMENTO, nome })).toThrow(NomeDeProdutorInvalido);
  });

  it('reconstrói um Produtor que veio da persistência sem inventar identificador', () => {
    const produtor = Produtor.restaurar({
      id: '0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
      documento: DOCUMENTO,
      nome: 'Maria da Silva',
    });

    expect(produtor.id).toBe('0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b');
  });
});
