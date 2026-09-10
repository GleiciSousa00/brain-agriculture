import { Area } from './area';
import { Propriedade } from './propriedade';
import {
  AreasNaoFecham,
  CidadeInvalida,
  EstadoInvalido,
  NomeDePropriedadeInvalido,
} from './propriedade.errors';

const PRODUTOR_ID = '3f2f0c8e-6a1e-4a2b-9f0e-0f0a1b2c3d4e';

function dados(areas: { total: number; agricultavel: number; vegetacao: number }) {
  return {
    produtorId: PRODUTOR_ID,
    nome: 'Fazenda Boa Vista',
    cidade: 'Sorriso',
    estado: 'MT',
    areaTotal: Area.criar(areas.total),
    areaAgricultavel: Area.criar(areas.agricultavel),
    areaDeVegetacao: Area.criar(areas.vegetacao),
  };
}

describe('Propriedade', () => {
  it('registra a Propriedade em nome de um Produtor, com nome, cidade, estado e as três áreas', () => {
    const propriedade = Propriedade.criar(dados({ total: 100, agricultavel: 60, vegetacao: 30 }));

    expect(propriedade.produtorId).toBe(PRODUTOR_ID);
    expect(propriedade.nome).toBe('Fazenda Boa Vista');
    expect(propriedade.cidade).toBe('Sorriso');
    expect(propriedade.estado).toBe('MT');
    expect(propriedade.areaTotal.hectares).toBe(100);
    expect(propriedade.areaAgricultavel.hectares).toBe(60);
    expect(propriedade.areaDeVegetacao.hectares).toBe(30);
  });

  it('recusa quando a soma passa da Área Total', () => {
    expect(() => Propriedade.criar(dados({ total: 100, agricultavel: 60, vegetacao: 60 }))).toThrow(
      AreasNaoFecham,
    );
  });

  it('diz na mensagem qual é a soma e qual é a Área Total', () => {
    expect(() =>
      Propriedade.criar(dados({ total: 100.5, agricultavel: 60.25, vegetacao: 60.5 })),
    ).toThrow('A soma da Área Agricultável com a Área de Vegetação é de 120,75 ha e passa da Área Total, de 100,50 ha.');
  });

  it('aceita a soma igual à Área Total', () => {
    const propriedade = Propriedade.criar(dados({ total: 100, agricultavel: 70, vegetacao: 30 }));

    expect(propriedade.areaTotal.hectares).toBe(100);
  });

  it('aceita a soma igual à Área Total mesmo com casas decimais', () => {
    expect(() => Propriedade.criar(dados({ total: 0.3, agricultavel: 0.1, vegetacao: 0.2 }))).not.toThrow();
  });

  it('descarta espaço em volta do nome', () => {
    const propriedade = Propriedade.criar({
      ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }),
      nome: '  Fazenda Boa Vista  ',
    });

    expect(propriedade.nome).toBe('Fazenda Boa Vista');
  });

  it('recusa nome longo demais', () => {
    const nome = 'a'.repeat(201);

    expect(() =>
      Propriedade.criar({ ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }), nome }),
    ).toThrow(NomeDePropriedadeInvalido);
  });

  it.each([
    ['vazio', ''],
    ['só espaço', '   '],
  ])('recusa nome %s', (_caso, nome) => {
    expect(() =>
      Propriedade.criar({ ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }), nome }),
    ).toThrow(NomeDePropriedadeInvalido);
  });

  it('recusa cidade em branco', () => {
    expect(() => Propriedade.criar({ ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }), cidade: '  ' })).toThrow(
      CidadeInvalida,
    );
  });

  it('recusa cidade longa demais', () => {
    const cidade = 'a'.repeat(121);

    expect(() =>
      Propriedade.criar({ ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }), cidade }),
    ).toThrow(CidadeInvalida);
  });

  it('recusa estado que não é unidade federativa', () => {
    expect(() => Propriedade.criar({ ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }), estado: 'XX' })).toThrow(
      EstadoInvalido,
    );
  });

  it('aceita o estado em minúscula e guarda em maiúscula', () => {
    const propriedade = Propriedade.criar({
      ...dados({ total: 1, agricultavel: 0, vegetacao: 0 }),
      estado: 'mt',
    });

    expect(propriedade.estado).toBe('MT');
  });

  it('revalida a regra ao editar as áreas', () => {
    const propriedade = Propriedade.criar(dados({ total: 100, agricultavel: 60, vegetacao: 30 }));

    expect(() =>
      propriedade.editar({
        nome: 'Fazenda Boa Vista',
        cidade: 'Sorriso',
        estado: 'MT',
        areaTotal: Area.criar(100),
        areaAgricultavel: Area.criar(80),
        areaDeVegetacao: Area.criar(30),
      }),
    ).toThrow(AreasNaoFecham);
  });

  it('a edição preserva o identificador e o Produtor', () => {
    const propriedade = Propriedade.criar(dados({ total: 100, agricultavel: 60, vegetacao: 30 }));

    const editada = propriedade.editar({
      nome: 'Fazenda Santa Rita',
      cidade: 'Lucas do Rio Verde',
      estado: 'MT',
      areaTotal: Area.criar(200),
      areaAgricultavel: Area.criar(150),
      areaDeVegetacao: Area.criar(50),
    });

    expect(editada.id).toBe(propriedade.id);
    expect(editada.produtorId).toBe(PRODUTOR_ID);
    expect(editada.nome).toBe('Fazenda Santa Rita');
    expect(editada.cidade).toBe('Lucas do Rio Verde');
    expect(editada.areaAgricultavel.hectares).toBe(150);
  });

  it('confere o nome de novo ao editar', () => {
    const propriedade = Propriedade.criar(dados({ total: 100, agricultavel: 60, vegetacao: 30 }));

    expect(() =>
      propriedade.editar({
        nome: '   ',
        cidade: 'Sorriso',
        estado: 'MT',
        areaTotal: Area.criar(100),
        areaAgricultavel: Area.criar(60),
        areaDeVegetacao: Area.criar(30),
      }),
    ).toThrow(NomeDePropriedadeInvalido);
  });

  it('volta da persistência sem reaplicar a regra da soma', () => {
    const propriedade = Propriedade.restaurar({
      id: '9c1e0f2a-2b3c-4d5e-8f90-a1b2c3d4e5f6',
      ...dados({ total: 100, agricultavel: 60, vegetacao: 30 }),
      areaAgricultavel: Area.restaurar(90),
      areaDeVegetacao: Area.restaurar(90),
    });

    expect(propriedade.areaAgricultavel.hectares).toBe(90);
  });

  it('volta da persistência com o nome gravado, sem conferi-lo de novo', () => {
    const propriedade = Propriedade.restaurar({
      id: '9c1e0f2a-2b3c-4d5e-8f90-a1b2c3d4e5f6',
      ...dados({ total: 100, agricultavel: 60, vegetacao: 30 }),
      nome: '  Fazenda gravada sob a regra antiga  ',
    });

    expect(propriedade.nome).toBe('  Fazenda gravada sob a regra antiga  ');
  });
});
