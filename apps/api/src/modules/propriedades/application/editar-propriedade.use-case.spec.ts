import { Area } from '../domain/area';
import { Propriedade } from '../domain/propriedade';
import { AreasNaoFecham, PropriedadeNaoEncontrada } from '../domain/propriedade.errors';
import { EditarPropriedadeUseCase } from './editar-propriedade.use-case';
import { PropriedadeRepositoryEmMemoria } from './__fakes__/propriedade-repository-em-memoria';

const PRODUTOR_ID = '3f2f0c8e-6a1e-4a2b-9f0e-0f0a1b2c3d4e';
const AUSENTE = '00000000-0000-4000-8000-000000000000';

async function cenario() {
  const repository = new PropriedadeRepositoryEmMemoria();
  const propriedade = Propriedade.criar({
    produtorId: PRODUTOR_ID,
    cidade: 'Sorriso',
    estado: 'MT',
    areaTotal: Area.criar(100),
    areaAgricultavel: Area.criar(60),
    areaDeVegetacao: Area.criar(30),
  });
  await repository.save(propriedade);

  return { repository, propriedade, useCase: new EditarPropriedadeUseCase(repository) };
}

const areasNovas = { areaTotal: 200, areaAgricultavel: 150, areaDeVegetacao: 50 };

describe('EditarPropriedadeUseCase', () => {
  it('grava as áreas novas', async () => {
    const { useCase, repository, propriedade } = await cenario();

    const editada = await useCase.execute(propriedade.id, {
      cidade: 'Sorriso',
      estado: 'MT',
      ...areasNovas,
    });

    expect(editada.areaTotal.hectares).toBe(200);
    await expect(repository.findById(propriedade.id)).resolves.toBe(editada);
  });

  it('revalida a regra da soma e não grava quando ela não fecha', async () => {
    const { useCase, repository, propriedade } = await cenario();
    const save = jest.spyOn(repository, 'save');

    await expect(
      useCase.execute(propriedade.id, {
        cidade: 'Sorriso',
        estado: 'MT',
        areaTotal: 100,
        areaAgricultavel: 80,
        areaDeVegetacao: 30,
      }),
    ).rejects.toThrow(AreasNaoFecham);
    expect(save).not.toHaveBeenCalled();
  });

  it('recusa editar Propriedade que não existe', async () => {
    const { useCase } = await cenario();

    await expect(
      useCase.execute(AUSENTE, { cidade: 'Sorriso', estado: 'MT', ...areasNovas }),
    ).rejects.toThrow(PropriedadeNaoEncontrada);
  });
});
