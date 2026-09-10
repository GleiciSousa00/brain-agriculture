import { Area } from '../../propriedades/domain/area';
import { Propriedade } from '../../propriedades/domain/propriedade';
import { Documento } from '../domain/documento';
import { paraResposta, paraRespostaDetalhada } from './produtor.presenter';
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

  function propriedade() {
    return Propriedade.criar({
      produtorId: produtor.id,
      cidade: 'Sorriso',
      estado: 'MT',
      areaTotal: Area.criar(100.5),
      areaAgricultavel: Area.criar(60.25),
      areaDeVegetacao: Area.criar(30),
    });
  }

  it('devolve as áreas em hectares, e não o objeto de valor', () => {
    const resposta = paraRespostaDetalhada({ produtor, propriedades: [propriedade()] });

    expect(resposta.propriedades[0]).toMatchObject({
      cidade: 'Sorriso',
      estado: 'MT',
      areaTotal: 100.5,
      areaAgricultavel: 60.25,
      areaDeVegetacao: 30,
    });
  });

  it('continua mascarando o Documento', () => {
    const resposta = paraRespostaDetalhada({ produtor, propriedades: [propriedade()] });

    expect(resposta.documento).toBe('***.***.247-25');
    expect(JSON.stringify(resposta)).not.toContain('52998224725');
  });

  it('devolve lista vazia quando o Produtor não tem Propriedade', () => {
    expect(paraRespostaDetalhada({ produtor, propriedades: [] }).propriedades).toEqual([]);
  });
});
