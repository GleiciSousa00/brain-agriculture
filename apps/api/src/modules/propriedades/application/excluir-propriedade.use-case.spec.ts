import { Area } from '../domain/area';
import { Propriedade } from '../domain/propriedade';
import { PropriedadeNaoEncontrada } from '../domain/propriedade.errors';
import { ExcluirPropriedadeUseCase } from './excluir-propriedade.use-case';
import { PropriedadeRepositoryEmMemoria } from './__fakes__/propriedade-repository-em-memoria';

const AUSENTE = '00000000-0000-4000-8000-000000000000';

async function cenario() {
  const repository = new PropriedadeRepositoryEmMemoria();
  const propriedade = Propriedade.criar({
    produtorId: '3f2f0c8e-6a1e-4a2b-9f0e-0f0a1b2c3d4e',
    cidade: 'Sorriso',
    estado: 'MT',
    areaTotal: Area.criar(100),
    areaAgricultavel: Area.criar(60),
    areaDeVegetacao: Area.criar(30),
  });
  await repository.save(propriedade);

  return { repository, propriedade, useCase: new ExcluirPropriedadeUseCase(repository) };
}

describe('ExcluirPropriedadeUseCase', () => {
  it('remove a Propriedade', async () => {
    const { useCase, repository, propriedade } = await cenario();

    await useCase.execute(propriedade.id);

    await expect(repository.findById(propriedade.id)).resolves.toBeNull();
  });

  it('recusa excluir Propriedade que não existe', async () => {
    const { useCase } = await cenario();

    await expect(useCase.execute(AUSENTE)).rejects.toThrow(PropriedadeNaoEncontrada);
  });
});
