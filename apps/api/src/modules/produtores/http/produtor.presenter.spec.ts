import { Documento } from '../domain/documento';
import { paraResposta } from './produtor.presenter';
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
