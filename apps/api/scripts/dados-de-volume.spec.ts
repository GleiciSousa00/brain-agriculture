import { CULTURAS_INICIAIS } from '../src/modules/culturas/culturas.module';
import { UNIDADES_FEDERATIVAS } from '../src/modules/propriedades/propriedades.module';
import {
  PRODUTORES_DE_VOLUME,
  planejarVolume,
  plantiosDoPlano,
  type PropriedadeDeVolume,
} from './dados-de-volume';

/**
 * O que este teste prova, e por que ele existe.
 *
 * A carga de volume só se vê inteira contra um Postgres, e isso a pipeline faz. O que dá
 * para provar sem banco é o formato do conjunto, que é justamente onde ela errou antes: as
 * mil Propriedades foram parar todas no mesmo Produtor, e nenhum teste percebeu.
 */

const CATALOGO = { culturas: CULTURAS_INICIAIS.length, safras: 10 };
const ALVO = 100_000;

const produtores = PRODUTORES_DE_VOLUME.map((_, indice) => `produtor-${indice}`);
const plano = planejarVolume(produtores, CATALOGO, ALVO);

function contarPor(chave: (uma: PropriedadeDeVolume) => string): Map<string, number> {
  const contagem = new Map<string, number>();

  for (const propriedade of plano) {
    const valor = chave(propriedade);
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }

  return contagem;
}

describe('o plano da carga de volume', () => {
  it('alcança o alvo de Plantios sem passar de uma Propriedade dele', () => {
    const total = plantiosDoPlano(plano);
    const ultima = plano[plano.length - 1];

    expect(total).toBeGreaterThanOrEqual(ALVO);
    expect(total - (ultima?.culturas ?? 0) * (ultima?.safras ?? 0)).toBeLessThan(ALVO);
  });

  it('fecha a soma das áreas em toda Propriedade', () => {
    for (const { areaTotal, areaAgricultavel, areaDeVegetacao } of plano) {
      expect(areaAgricultavel + areaDeVegetacao).toBeCloseTo(areaTotal, 2);
      expect(areaAgricultavel).toBeGreaterThan(0);
      expect(areaDeVegetacao).toBeGreaterThan(0);
    }
  });

  it('não deixa Produtor nenhum sem Propriedade, e não dá o mesmo tanto a todos', () => {
    const porProdutor = contarPor((uma) => uma.produtorId);
    const quantidades = [...porProdutor.values()];

    expect(porProdutor.size).toBe(produtores.length);
    expect(Math.max(...quantidades)).toBeGreaterThan(Math.min(...quantidades) * 2);
  });

  it('não repete nome de Propriedade', () => {
    expect(new Set(plano.map((uma) => uma.nome)).size).toBe(plano.length);
  });

  it('situa as Propriedades em siglas conhecidas, e não em partes iguais', () => {
    const porEstado = contarPor((uma) => uma.estado);
    const quantidades = [...porEstado.values()];

    for (const sigla of porEstado.keys()) {
      expect(UNIDADES_FEDERATIVAS as readonly string[]).toContain(sigla);
    }

    expect(porEstado.size).toBe(UNIDADES_FEDERATIVAS.length);
    expect(Math.max(...quantidades)).toBeGreaterThan(Math.min(...quantidades) * 2);
  });

  it('varia quanto do catálogo cada Propriedade planta, sem passar do que existe', () => {
    expect(new Set(plano.map((uma) => uma.culturas)).size).toBeGreaterThan(1);
    expect(new Set(plano.map((uma) => uma.safras)).size).toBeGreaterThan(1);
    expect(Math.max(...plano.map((uma) => uma.culturas))).toBeLessThanOrEqual(CATALOGO.culturas);
    expect(Math.max(...plano.map((uma) => uma.safras))).toBeLessThanOrEqual(CATALOGO.safras);
  });

  it('corta o pedido no tamanho de um catálogo menor', () => {
    const curto = planejarVolume(produtores, { culturas: 2, safras: 3 }, 100);

    expect(Math.max(...curto.map((uma) => uma.culturas))).toBe(2);
    expect(Math.max(...curto.map((uma) => uma.safras))).toBe(3);
  });

  it('dá o mesmo conjunto a cada execução, menos os identificadores', () => {
    const outro = planejarVolume(produtores, CATALOGO, ALVO);
    const forma = ({ id: _id, ...resto }: PropriedadeDeVolume) => resto;

    expect(outro.map(forma)).toEqual(plano.map(forma));
    expect(outro[0]?.id).not.toBe(plano[0]?.id);
  });

  it('recusa carga sem Produtor e catálogo vazio', () => {
    expect(() => planejarVolume([], CATALOGO, 10)).toThrow(/Produtor/);
    expect(() => planejarVolume(produtores, { culturas: 0, safras: 10 }, 10)).toThrow(/Plantio/);
    expect(() => planejarVolume(produtores, { culturas: 10, safras: 0 }, 10)).toThrow(/Plantio/);
  });
});

describe('os Produtores da carga de volume', () => {
  it('cabem na primeira página do catálogo que a tela do cadastro carrega', () => {
    expect(PRODUTORES_DE_VOLUME.length).toBeLessThanOrEqual(100);
  });

  it('não repetem Documento nem nome', () => {
    expect(new Set(PRODUTORES_DE_VOLUME.map((um) => um.documento)).size).toBe(
      PRODUTORES_DE_VOLUME.length,
    );
    expect(new Set(PRODUTORES_DE_VOLUME.map((um) => um.nome)).size).toBe(
      PRODUTORES_DE_VOLUME.length,
    );
  });
});
