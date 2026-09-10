import { randomUUID } from 'node:crypto';
import { Cultura } from '../../culturas/domain/cultura';
import { Plantio } from '../../plantios/domain/plantio';
import { Area } from '../../propriedades/domain/area';
import { Propriedade } from '../../propriedades/domain/propriedade';
import { MontarPainelUseCase } from './montar-painel.use-case';
import { CulturasDoPainelEmMemoria } from './__fakes__/culturas-do-painel-em-memoria';
import { PlantiosDoPainelEmMemoria } from './__fakes__/plantios-do-painel-em-memoria';
import { PropriedadesDoPainelEmMemoria } from './__fakes__/propriedades-do-painel-em-memoria';

const SAFRA_2031 = 'd4e5f6a7-b8c9-4a3b-8d4e-5f6a7b8c9d0e';
const SAFRA_2032 = 'e5f6a7b8-c9d0-4b4c-9e5f-6a7b8c9d0e1f';
const SEM_PLANTIO = 'f6a7b8c9-d0e1-4c5d-8f60-7b8c9d0e1f2a';

function cenario() {
  const propriedades = new PropriedadesDoPainelEmMemoria();
  const plantios = new PlantiosDoPainelEmMemoria();
  const culturas = new CulturasDoPainelEmMemoria();

  return {
    propriedades,
    plantios,
    culturas,
    montar: new MontarPainelUseCase(propriedades, plantios, culturas),
  };
}

/**
 * Um cadastro pequeno e conferido à mão: três Propriedades em dois estados, duas Culturas
 * e cinco Plantios em duas Safras. Os números esperados nos testes saem desta tabela, e
 * não de repetir a conta que o código faz.
 */
function cadastro() {
  const montado = cenario();
  const soja = Cultura.criar({ nome: 'Soja' });
  const milho = Cultura.criar({ nome: 'Milho' });
  const emMatoGrosso = propriedadeDe('MT', 100, 60, 40);
  const outraEmMatoGrosso = propriedadeDe('MT', 50, 30, 20);
  const emSaoPaulo = propriedadeDe('SP', 25.5, 15.5, 10);

  montado.culturas.acrescentar(soja, milho);
  montado.propriedades.acrescentar(emMatoGrosso, outraEmMatoGrosso, emSaoPaulo);
  montado.plantios.acrescentar(
    plantioDe(emMatoGrosso.id, soja.id, SAFRA_2031),
    plantioDe(outraEmMatoGrosso.id, soja.id, SAFRA_2031),
    plantioDe(emSaoPaulo.id, soja.id, SAFRA_2031),
    plantioDe(emMatoGrosso.id, milho.id, SAFRA_2031),
    plantioDe(outraEmMatoGrosso.id, milho.id, SAFRA_2032),
  );

  return { ...montado, soja, milho };
}

function propriedadeDe(
  estado: string,
  areaTotal: number,
  areaAgricultavel: number,
  areaDeVegetacao: number,
): Propriedade {
  return Propriedade.criar({
    produtorId: randomUUID(),
    nome: 'Fazenda Boa Vista',
    cidade: 'Sorriso',
    estado,
    areaTotal: Area.criar(areaTotal),
    areaAgricultavel: Area.criar(areaAgricultavel),
    areaDeVegetacao: Area.criar(areaDeVegetacao),
  });
}

function plantioDe(propriedadeId: string, culturaId: string, safraId: string): Plantio {
  return Plantio.criar({ propriedadeId, culturaId, safraId });
}

describe('MontarPainelUseCase', () => {
  it('devolve zeros, e não erro, quando a base está vazia', async () => {
    const { montar } = cenario();

    const painel = await montar.execute({});

    expect(painel.totais.propriedades).toBe(0);
    expect(painel.totais.areaTotal.hectares).toBe(0);
    expect(painel.usoDoSolo.areaAgricultavel.hectares).toBe(0);
    expect(painel.usoDoSolo.areaDeVegetacao.hectares).toBe(0);
    expect(painel.propriedadesPorEstado).toEqual([]);
    expect(painel.plantiosPorCultura).toEqual([]);
  });

  it('soma os dois totais e o Uso do Solo do cadastro inteiro', async () => {
    const { montar } = cadastro();

    const painel = await montar.execute({});

    expect(painel.totais.propriedades).toBe(3);
    expect(painel.totais.areaTotal.hectares).toBe(175.5);
    expect(painel.usoDoSolo.areaAgricultavel.hectares).toBe(105.5);
    expect(painel.usoDoSolo.areaDeVegetacao.hectares).toBe(70);
  });

  it('distribui as Propriedades por estado, da maior fatia para a menor', async () => {
    const { montar } = cadastro();

    const painel = await montar.execute({});

    expect(painel.propriedadesPorEstado).toEqual([
      { estado: 'MT', propriedades: 2 },
      { estado: 'SP', propriedades: 1 },
    ]);
  });

  it('distribui os Plantios por Cultura, com o nome que veio do catálogo', async () => {
    const { montar, soja, milho } = cadastro();

    const painel = await montar.execute({});

    expect(painel.plantiosPorCultura).toEqual([
      { culturaId: soja.id, cultura: 'Soja', plantios: 3 },
      { culturaId: milho.id, cultura: 'Milho', plantios: 2 },
    ]);
  });

  it('o filtro por Safra recorta a distribuição por Cultura e não mexe no resto', async () => {
    const { montar, soja, milho } = cadastro();

    const inteiro = await montar.execute({});
    const recortado = await montar.execute({ safraId: SAFRA_2031 });

    expect(recortado.plantiosPorCultura).toEqual([
      { culturaId: soja.id, cultura: 'Soja', plantios: 3 },
      { culturaId: milho.id, cultura: 'Milho', plantios: 1 },
    ]);
    expect(recortado.totais).toEqual(inteiro.totais);
    expect(recortado.usoDoSolo).toEqual(inteiro.usoDoSolo);
    expect(recortado.propriedadesPorEstado).toEqual(inteiro.propriedadesPorEstado);
  });

  it('uma Safra sem nenhum Plantio devolve a distribuição por Cultura vazia', async () => {
    const { montar } = cadastro();

    const painel = await montar.execute({ safraId: SEM_PLANTIO });

    expect(painel.plantiosPorCultura).toEqual([]);
    expect(painel.totais.propriedades).toBe(3);
  });

  it('falha alto quando a Cultura contada não está no catálogo', async () => {
    const { montar, plantios } = cenario();
    const foraDoCatalogo = Cultura.criar({ nome: 'Sorgo' });
    plantios.acrescentar(plantioDe(randomUUID(), foraDoCatalogo.id, SAFRA_2031));

    await expect(montar.execute({})).rejects.toThrow(foraDoCatalogo.id);
  });
});
