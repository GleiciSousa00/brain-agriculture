import {
  CulturaDoPlantioNaoEncontrada,
  PlantioDuplicado,
  PropriedadeDoPlantioNaoEncontrada,
  SafraDoPlantioNaoEncontrada,
} from '../domain/plantio.errors';
import { PlantioRepositoryEmMemoria } from './__fakes__/plantio-repository-em-memoria';
import { RegistrarPlantioUseCase } from './registrar-plantio.use-case';
import type { ReferenciasConhecidas } from './__fakes__/plantio-repository-em-memoria';

const PROPRIEDADE = '3f1b7e5c-0a4d-4c8e-9a11-6b2c8d5e7f01';
const OUTRA_PROPRIEDADE = '9d7c5b3a-1e2f-4068-8a4c-0b6d8e2f4a17';
const SOJA = '7c2d9a1e-5b3f-4e6a-8d02-1f4b6c8e9a23';
const MILHO = 'a1b2c3d4-e5f6-4708-9a1b-2c3d4e5f6a7b';
const SAFRA_2026 = 'b5e8d3c1-2a6f-4907-9c4b-8e1d3f5a7c69';
const SAFRA_2025 = 'c6f9e4d2-3b70-4a18-8d5c-9f2e4a6b8c01';

const INEXISTENTE = 'f0e1d2c3-b4a5-4968-8778-695a4b3c2d1e';

function cenario(conhecidas?: ReferenciasConhecidas) {
  const repository = new PlantioRepositoryEmMemoria(conhecidas);

  return { repository, registrar: new RegistrarPlantioUseCase(repository) };
}

/** Um cadastro onde só a Propriedade, a Cultura e a Safra abaixo existem. */
const CADASTRO: ReferenciasConhecidas = {
  propriedades: [PROPRIEDADE],
  culturas: [SOJA],
  safras: [SAFRA_2026],
};

describe('RegistrarPlantioUseCase', () => {
  it('liga a Cultura à Propriedade na Safra', async () => {
    const { registrar, repository } = cenario();

    const plantio = await registrar.execute({
      propriedadeId: PROPRIEDADE,
      culturaId: SOJA,
      safraId: SAFRA_2026,
    });

    expect(plantio).toMatchObject({
      propriedadeId: PROPRIEDADE,
      culturaId: SOJA,
      safraId: SAFRA_2026,
    });
    await expect(repository.findById(plantio.id)).resolves.toBe(plantio);
  });

  it('aceita Culturas diferentes na mesma Propriedade e na mesma Safra', async () => {
    const { registrar, repository } = cenario();

    const soja = await registrar.execute({
      propriedadeId: PROPRIEDADE,
      culturaId: SOJA,
      safraId: SAFRA_2026,
    });
    const milho = await registrar.execute({
      propriedadeId: PROPRIEDADE,
      culturaId: MILHO,
      safraId: SAFRA_2026,
    });

    expect(milho.id).not.toBe(soja.id);
    await expect(
      repository.listByPropriedade({ propriedadeId: PROPRIEDADE, deslocamento: 0, limite: 10 }),
    ).resolves.toMatchObject({ total: 2 });
  });

  it('recusa a mesma Cultura na mesma Propriedade e na mesma Safra', async () => {
    const { registrar } = cenario();
    const ligacao = { propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 };
    await registrar.execute(ligacao);

    await expect(registrar.execute(ligacao)).rejects.toThrow(PlantioDuplicado);
  });

  it('aceita a mesma Cultura em Safras diferentes', async () => {
    const { registrar } = cenario();
    await registrar.execute({
      propriedadeId: PROPRIEDADE,
      culturaId: SOJA,
      safraId: SAFRA_2026,
    });

    await expect(
      registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2025 }),
    ).resolves.toMatchObject({ safraId: SAFRA_2025 });
  });

  it('aceita a mesma Cultura e a mesma Safra em outra Propriedade', async () => {
    const { registrar } = cenario();
    await registrar.execute({
      propriedadeId: PROPRIEDADE,
      culturaId: SOJA,
      safraId: SAFRA_2026,
    });

    await expect(
      registrar.execute({
        propriedadeId: OUTRA_PROPRIEDADE,
        culturaId: SOJA,
        safraId: SAFRA_2026,
      }),
    ).resolves.toMatchObject({ propriedadeId: OUTRA_PROPRIEDADE });
  });

  it('recusa o repetido antes de gravar', async () => {
    const { registrar, repository } = cenario();
    const ligacao = { propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 };
    await registrar.execute(ligacao);
    const save = jest.spyOn(repository, 'save');

    await expect(registrar.execute(ligacao)).rejects.toThrow(PlantioDuplicado);
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a Propriedade não existe',
      { propriedadeId: INEXISTENTE, culturaId: SOJA, safraId: SAFRA_2026 },
      PropriedadeDoPlantioNaoEncontrada,
    ],
    [
      'a Cultura não está no catálogo',
      { propriedadeId: PROPRIEDADE, culturaId: INEXISTENTE, safraId: SAFRA_2026 },
      CulturaDoPlantioNaoEncontrada,
    ],
    [
      'a Safra não existe',
      { propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: INEXISTENTE },
      SafraDoPlantioNaoEncontrada,
    ],
  ])('recusa e diz qual referência falta quando %s', async (_caso, ligacao, esperado) => {
    const { registrar } = cenario(CADASTRO);

    await expect(registrar.execute(ligacao)).rejects.toThrow(esperado);
  });

  it('grava quando as três referências existem', async () => {
    const { registrar } = cenario(CADASTRO);

    await expect(
      registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 }),
    ).resolves.toMatchObject({ propriedadeId: PROPRIEDADE });
  });
});