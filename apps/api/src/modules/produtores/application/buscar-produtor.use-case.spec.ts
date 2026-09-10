import { Area } from '../../propriedades/domain/area';
import { Propriedade } from '../../propriedades/domain/propriedade';
import { BuscarProdutorUseCase } from './buscar-produtor.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';
import { PropriedadesDoProdutorEmMemoria } from './__fakes__/propriedades-do-produtor-em-memoria';

async function cenario() {
  const repository = new ProdutorRepositoryEmMemoria();
  const propriedades = new PropriedadesDoProdutorEmMemoria();
  const produtor = Produtor.criar({
    documento: Documento.criar('529.982.247-25'),
    nome: 'Maria da Silva',
  });
  await repository.save(produtor);

  return {
    repository,
    propriedades,
    produtor,
    useCase: new BuscarProdutorUseCase(repository, propriedades),
  };
}

function propriedadeDe(produtorId: string, cidade: string): Propriedade {
  return Propriedade.criar({
    produtorId,
    cidade,
    estado: 'MT',
    areaTotal: Area.criar(100),
    areaAgricultavel: Area.criar(60),
    areaDeVegetacao: Area.criar(30),
  });
}

describe('BuscarProdutorUseCase', () => {
  it('devolve o Produtor gravado', async () => {
    const { useCase, produtor } = await cenario();

    await expect(useCase.execute(produtor.id)).resolves.toMatchObject({ produtor });
  });

  it('devolve as Propriedades do Produtor junto', async () => {
    const { useCase, produtor, propriedades } = await cenario();
    propriedades.acrescentar(propriedadeDe(produtor.id, 'Sorriso'));

    const encontrado = await useCase.execute(produtor.id);

    expect(encontrado.propriedades.map((propriedade) => propriedade.cidade)).toEqual(['Sorriso']);
  });

  it('devolve o Produtor sem nenhuma Propriedade, porque ele pode existir assim', async () => {
    const { useCase, produtor } = await cenario();

    await expect(useCase.execute(produtor.id)).resolves.toMatchObject({ propriedades: [] });
  });

  it('não devolve Propriedade de outro Produtor', async () => {
    const { useCase, produtor, propriedades } = await cenario();
    propriedades.acrescentar(propriedadeDe('7a6b5c4d-3e2f-4a1b-8c9d-0e1f2a3b4c5d', 'Bagé'));

    await expect(useCase.execute(produtor.id)).resolves.toMatchObject({ propriedades: [] });
  });

  it('recusa identificador que não existe', async () => {
    const { useCase } = await cenario();

    await expect(useCase.execute('0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b')).rejects.toThrow(
      ProdutorNaoEncontrado,
    );
  });
});
