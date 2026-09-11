import { Area } from '../../propriedades/domain/area';
import { Propriedade } from '../../propriedades/domain/propriedade';
import { ListarProdutoresUseCase } from './listar-produtores.use-case';
import type { ProdutorListado } from './listar-produtores.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';
import { PropriedadesDoProdutorEmMemoria } from './__fakes__/propriedades-do-produtor-em-memoria';

/**
 * Documentos distintos e válidos, porque o Produtor é único pelo Documento, e nomes fora
 * de ordem alfabética de propósito: a ordem da listagem é do repositório, não da ordem de
 * chegada.
 */
const CADASTRO = [
  { documento: '98765432100', nome: 'Diego Rocha' },
  { documento: '52998224725', nome: 'Ana Prado' },
  { documento: '24681357928', nome: 'Elisa Tavares' },
  { documento: '11144477735', nome: 'Bruno Lima' },
  { documento: '12345678909', nome: 'Carla Nunes' },
];

async function cenario(quantidade: number) {
  const repository = new ProdutorRepositoryEmMemoria();
  const propriedades = new PropriedadesDoProdutorEmMemoria();
  const gravados: Produtor[] = [];

  for (const { documento, nome } of CADASTRO.slice(0, quantidade)) {
    const produtor = Produtor.criar({ documento: Documento.criar(documento), nome });
    await repository.save(produtor);
    gravados.push(produtor);
  }

  return {
    repository,
    propriedades,
    gravados,
    useCase: new ListarProdutoresUseCase(repository, propriedades),
  };
}

function propriedadeDe(produtorId: string, nome: string): Propriedade {
  return Propriedade.criar({
    produtorId,
    nome,
    cidade: 'Sorriso',
    estado: 'MT',
    areaTotal: Area.criar(100),
    areaAgricultavel: Area.criar(60),
    areaDeVegetacao: Area.criar(30),
  });
}

function nomes(itens: ProdutorListado[]): string[] {
  return itens.map(({ produtor }) => produtor.nome);
}

describe('ListarProdutoresUseCase', () => {
  it('devolve a primeira página e o total do cadastro inteiro', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 2 });

    expect(nomes(pagina.itens)).toEqual(['Ana Prado', 'Bruno Lima']);
    expect(pagina.total).toBe(5);
  });

  it('devolve a fatia seguinte quando a página avança', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 2, tamanho: 2 });

    expect(nomes(pagina.itens)).toEqual(['Carla Nunes', 'Diego Rocha']);
  });

  it('devolve a última página incompleta sem completar com o que não existe', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 3, tamanho: 2 });

    expect(nomes(pagina.itens)).toEqual(['Elisa Tavares']);
  });

  it('devolve página vazia depois do fim, e o total continua sendo o do cadastro', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 9, tamanho: 2 });

    expect(pagina.itens).toEqual([]);
    expect(pagina.total).toBe(5);
  });

  it('repete a página e o tamanho pedidos, para quem monta a navegação', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 2, tamanho: 2 });

    expect(pagina.pagina).toBe(2);
    expect(pagina.tamanho).toBe(2);
  });

  it('devolve cadastro vazio sem erro', async () => {
    const { useCase } = await cenario(0);

    await expect(useCase.execute({ pagina: 1, tamanho: 20 })).resolves.toEqual({
      itens: [],
      total: 0,
      pagina: 1,
      tamanho: 20,
    });
  });

  it('diz quantas Propriedades cada Produtor da página tem', async () => {
    const { useCase, propriedades, gravados } = await cenario(5);
    const ana = gravados.filter((produtor) => produtor.nome === 'Ana Prado');
    propriedades.acrescentar(
      ...ana.map((produtor) => propriedadeDe(produtor.id, 'Fazenda Boa Vista')),
      ...ana.map((produtor) => propriedadeDe(produtor.id, 'Sítio das Águas')),
    );

    const pagina = await useCase.execute({ pagina: 1, tamanho: 2 });

    expect(pagina.itens.map((item) => item.propriedades)).toEqual([2, 0]);
  });

  it('conta zero para quem não tem Propriedade nenhuma', async () => {
    const { useCase } = await cenario(1);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 20 });

    expect(pagina.itens[0]?.propriedades).toBe(0);
  });

  it('recorta pelos identificadores pedidos, e o total é o do recorte', async () => {
    const { useCase, gravados } = await cenario(5);
    const escolhidos = gravados
      .filter((produtor) => ['Diego Rocha', 'Elisa Tavares'].includes(produtor.nome))
      .map((produtor) => produtor.id);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 20, ids: escolhidos });

    expect(nomes(pagina.itens)).toEqual(['Diego Rocha', 'Elisa Tavares']);
    expect(pagina.total).toBe(2);
  });

  it('não devolve ninguém quando a lista de identificadores vem vazia', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 20, ids: [] });

    expect(pagina.itens).toEqual([]);
    expect(pagina.total).toBe(0);
  });
});
