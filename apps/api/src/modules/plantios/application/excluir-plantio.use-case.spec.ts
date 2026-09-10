import { PlantioNaoEncontrado } from '../domain/plantio.errors';
import { PlantioRepositoryEmMemoria } from './__fakes__/plantio-repository-em-memoria';
import { ExcluirPlantioUseCase } from './excluir-plantio.use-case';
import { RegistrarPlantioUseCase } from './registrar-plantio.use-case';

const PROPRIEDADE = '3f1b7e5c-0a4d-4c8e-9a11-6b2c8d5e7f01';
const SOJA = '7c2d9a1e-5b3f-4e6a-8d02-1f4b6c8e9a23';
const SAFRA_2026 = 'b5e8d3c1-2a6f-4907-9c4b-8e1d3f5a7c69';
const INEXISTENTE = 'f0e1d2c3-b4a5-4968-8778-695a4b3c2d1e';

function cenario() {
  const repository = new PlantioRepositoryEmMemoria();

  return {
    repository,
    registrar: new RegistrarPlantioUseCase(repository),
    excluir: new ExcluirPlantioUseCase(repository),
  };
}

describe('ExcluirPlantioUseCase', () => {
  it('apaga o Plantio registrado', async () => {
    const { registrar, excluir, repository } = cenario();
    const plantio = await registrar.execute({
      propriedadeId: PROPRIEDADE,
      culturaId: SOJA,
      safraId: SAFRA_2026,
    });

    await excluir.execute(plantio.id);

    await expect(repository.findById(plantio.id)).resolves.toBeNull();
  });

  it('libera a ligação para ser registrada de novo', async () => {
    const { registrar, excluir } = cenario();
    const ligacao = { propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 };
    const plantio = await registrar.execute(ligacao);
    await excluir.execute(plantio.id);

    await expect(registrar.execute(ligacao)).resolves.toMatchObject(ligacao);
  });

  it('avisa que não existe, em vez de dizer que apagou o que nunca esteve lá', async () => {
    const { excluir } = cenario();

    await expect(excluir.execute(INEXISTENTE)).rejects.toThrow(PlantioNaoEncontrado);
  });
});
