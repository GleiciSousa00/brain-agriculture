import { Area } from '../domain/area';
import { Propriedade } from '../domain/propriedade';
import { ListarPropriedadesUseCase } from './listar-propriedades.use-case';
import { PropriedadeRepositoryEmMemoria } from './__fakes__/propriedade-repository-em-memoria';

const PRODUTOR_ID = '3f2f0c8e-6a1e-4a2b-9f0e-0f0a1b2c3d4e';

async function cenarioCom(quantas: number) {
  const repository = new PropriedadeRepositoryEmMemoria();

  for (let indice = 0; indice < quantas; indice += 1) {
    await repository.save(
      Propriedade.criar({
        produtorId: PRODUTOR_ID,
        cidade: `Cidade ${indice}`,
        estado: 'MT',
        areaTotal: Area.criar(10),
        areaAgricultavel: Area.criar(5),
        areaDeVegetacao: Area.criar(5),
      }),
    );
  }

  return { repository, useCase: new ListarPropriedadesUseCase(repository) };
}

describe('ListarPropriedadesUseCase', () => {
  it('devolve só a fatia pedida e o total do cadastro inteiro', async () => {
    const { useCase } = await cenarioCom(5);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 2 });

    expect(pagina.itens).toHaveLength(2);
    expect(pagina.total).toBe(5);
    expect(pagina.pagina).toBe(1);
    expect(pagina.tamanho).toBe(2);
  });

  it('a segunda página continua de onde a primeira parou', async () => {
    const { useCase } = await cenarioCom(5);

    const primeira = await useCase.execute({ pagina: 1, tamanho: 2 });
    const segunda = await useCase.execute({ pagina: 2, tamanho: 2 });

    expect(segunda.itens.map((item) => item.id)).not.toEqual(primeira.itens.map((item) => item.id));
  });

  it('a página além do fim vem vazia, e não em erro', async () => {
    const { useCase } = await cenarioCom(5);

    const pagina = await useCase.execute({ pagina: 9, tamanho: 2 });

    expect(pagina.itens).toEqual([]);
    expect(pagina.total).toBe(5);
  });
});
