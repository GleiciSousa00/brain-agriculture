import { ListarProdutoresUseCase } from './listar-produtores.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';

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

  for (const { documento, nome } of CADASTRO.slice(0, quantidade)) {
    await repository.save(Produtor.criar({ documento: Documento.criar(documento), nome }));
  }

  return { repository, useCase: new ListarProdutoresUseCase(repository) };
}

describe('ListarProdutoresUseCase', () => {
  it('devolve a primeira página e o total do cadastro inteiro', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 2 });

    expect(pagina.itens.map(({ nome }: Produtor) => nome)).toEqual(['Ana Prado', 'Bruno Lima']);
    expect(pagina.total).toBe(5);
  });

  it('devolve a fatia seguinte quando a página avança', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 2, tamanho: 2 });

    expect(pagina.itens.map(({ nome }: Produtor) => nome)).toEqual(['Carla Nunes', 'Diego Rocha']);
  });

  it('devolve a última página incompleta sem completar com o que não existe', async () => {
    const { useCase } = await cenario(5);

    const pagina = await useCase.execute({ pagina: 3, tamanho: 2 });

    expect(pagina.itens.map(({ nome }: Produtor) => nome)).toEqual(['Elisa Tavares']);
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
});
