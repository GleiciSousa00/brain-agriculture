import { Area } from '../../propriedades/domain/area';
import { Propriedade } from '../../propriedades/domain/propriedade';
import { Documento } from '../domain/documento';
import { paraPagina, paraResposta, paraRespostaDetalhada } from './produtor.presenter';
import { Produtor } from '../domain/produtor';

describe('paraResposta', () => {
  const produtor = Produtor.criar({
    documento: Documento.criar('529.982.247-25'),
    nome: 'Maria da Silva',
  });

  it('devolve o Documento mascarado, nunca o completo', () => {
    const resposta = paraResposta(produtor);

    expect(resposta.documento).toBe('***.***.247-25');
    expect(JSON.stringify(resposta)).not.toContain('52998224725');
  });

  it('devolve identificador, nome e tipo do Documento', () => {
    expect(paraResposta(produtor)).toMatchObject({
      id: produtor.id,
      nome: 'Maria da Silva',
      tipoDeDocumento: 'CPF',
    });
  });

  it('não devolve nenhum campo além dos quatro do esquema de saída', () => {
    expect(Object.keys(paraResposta(produtor)).sort()).toEqual([
      'documento',
      'id',
      'nome',
      'tipoDeDocumento',
    ]);
  });
});

describe('paraRespostaDetalhada', () => {
  const produtor = Produtor.criar({
    documento: Documento.criar('529.982.247-25'),
    nome: 'Maria da Silva',
  });

  function fatiaCom(...propriedades: Propriedade[]) {
    return { itens: propriedades, total: propriedades.length, pagina: 1, tamanho: 20 };
  }

  function propriedade() {
    return Propriedade.criar({
      produtorId: produtor.id,
      nome: 'Fazenda Boa Vista',
      cidade: 'Sorriso',
      estado: 'MT',
      areaTotal: Area.criar(100.5),
      areaAgricultavel: Area.criar(60.25),
      areaDeVegetacao: Area.criar(30),
    });
  }

  it('devolve as áreas em hectares, e não o objeto de valor', () => {
    const resposta = paraRespostaDetalhada({ produtor, propriedades: fatiaCom(propriedade()) });

    expect(resposta.propriedades.itens[0]).toMatchObject({
      nome: 'Fazenda Boa Vista',
      cidade: 'Sorriso',
      estado: 'MT',
      areaTotal: 100.5,
      areaAgricultavel: 60.25,
      areaDeVegetacao: 30,
    });
  });

  it('continua mascarando o Documento', () => {
    const resposta = paraRespostaDetalhada({ produtor, propriedades: fatiaCom(propriedade()) });

    expect(resposta.documento).toBe('***.***.247-25');
    expect(JSON.stringify(resposta)).not.toContain('52998224725');
  });

  it('devolve a fatia vazia quando o Produtor não tem Propriedade', () => {
    expect(paraRespostaDetalhada({ produtor, propriedades: fatiaCom() }).propriedades).toEqual({
      itens: [],
      total: 0,
      pagina: 1,
      tamanho: 20,
    });
  });
});

describe('paraPagina', () => {
  const produtor = Produtor.criar({
    documento: Documento.criar('529.982.247-25'),
    nome: 'Maria da Silva',
  });

  const pagina = {
    itens: [{ produtor, propriedades: 3 }],
    total: 37,
    pagina: 2,
    tamanho: 20,
  };

  it('mascara o Documento também na listagem', () => {
    const resposta = paraPagina(pagina);

    expect(JSON.stringify(resposta)).not.toContain('52998224725');
    expect(resposta.itens.at(0)?.documento).toBe('***.***.247-25');
  });

  it('devolve o total do cadastro e repete a página pedida', () => {
    expect(paraPagina(pagina)).toMatchObject({ total: 37, pagina: 2, tamanho: 20 });
  });

  it('leva junto quantas Propriedades o Produtor tem', () => {
    expect(paraPagina(pagina).itens.at(0)?.propriedades).toBe(3);
  });
});
