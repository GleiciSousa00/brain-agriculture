import { PropriedadeDoPlantioNaoEncontrada } from '../domain/plantio.errors';
import { PlantioRepositoryEmMemoria } from './__fakes__/plantio-repository-em-memoria';
import { PropriedadeDoPlantioEmMemoria } from './__fakes__/propriedade-do-plantio-em-memoria';
import { ListarPlantiosDaPropriedadeUseCase } from './listar-plantios-da-propriedade.use-case';
import { RegistrarPlantioUseCase } from './registrar-plantio.use-case';

const PROPRIEDADE = '3f1b7e5c-0a4d-4c8e-9a11-6b2c8d5e7f01';
const OUTRA_PROPRIEDADE = '9d7c5b3a-1e2f-4068-8a4c-0b6d8e2f4a17';
const SEM_PLANTIO = 'e2d4f6a8-0b1c-4d3e-9f50-6a7b8c9d0e1f';
const INEXISTENTE = 'f0e1d2c3-b4a5-4968-8778-695a4b3c2d1e';
const CAFE = 'a1b2c3d4-e5f6-4708-9a1b-2c3d4e5f6a7b';
const MILHO = 'b2c3d4e5-f6a7-4819-8b2c-3d4e5f6a7b8c';
const SOJA = 'c3d4e5f6-a7b8-492a-9c3d-4e5f6a7b8c9d';
const SAFRA_2025 = 'd4e5f6a7-b8c9-4a3b-8d4e-5f6a7b8c9d0e';
const SAFRA_2026 = 'e5f6a7b8-c9d0-4b4c-9e5f-6a7b8c9d0e1f';

function cenario() {
  const repository = new PlantioRepositoryEmMemoria();
  // As três Propriedades que existem no cadastro deste teste. A quarta, INEXISTENTE, não.
  const propriedades = new PropriedadeDoPlantioEmMemoria([
    PROPRIEDADE,
    OUTRA_PROPRIEDADE,
    SEM_PLANTIO,
  ]);

  return {
    repository,
    registrar: new RegistrarPlantioUseCase(repository),
    listar: new ListarPlantiosDaPropriedadeUseCase(repository, propriedades),
  };
}

describe('ListarPlantiosDaPropriedadeUseCase', () => {
  it('devolve os Plantios da Propriedade na ordem em que foram registrados', async () => {
    const { registrar, listar } = cenario();
    // Cadastrados fora de qualquer ordem alfabética ou de identificador, para a ordem de
    // registro ser a única que explica o resultado.
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 });
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: CAFE, safraId: SAFRA_2026 });
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2025 });
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: MILHO, safraId: SAFRA_2026 });

    const pagina = await listar.execute(PROPRIEDADE, { pagina: 1, tamanho: 20 });

    expect(pagina.itens.map((plantio) => [plantio.culturaId, plantio.safraId])).toEqual([
      [SOJA, SAFRA_2026],
      [CAFE, SAFRA_2026],
      [SOJA, SAFRA_2025],
      [MILHO, SAFRA_2026],
    ]);
    expect(pagina).toMatchObject({ total: 4, pagina: 1, tamanho: 20 });
  });

  it('não mistura os Plantios de outra Propriedade', async () => {
    const { registrar, listar } = cenario();
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 });
    await registrar.execute({
      propriedadeId: OUTRA_PROPRIEDADE,
      culturaId: MILHO,
      safraId: SAFRA_2026,
    });

    const pagina = await listar.execute(PROPRIEDADE, { pagina: 1, tamanho: 20 });

    expect(pagina.itens.map((plantio) => plantio.culturaId)).toEqual([SOJA]);
    expect(pagina.total).toBe(1);
  });

  it('avisa que a Propriedade não existe, em vez de devolver fatia vazia', async () => {
    const { listar } = cenario();

    await expect(listar.execute(INEXISTENTE, { pagina: 1, tamanho: 20 })).rejects.toThrow(
      PropriedadeDoPlantioNaoEncontrada,
    );
  });

  it('devolve fatia vazia para uma Propriedade que existe e não tem nenhum Plantio', async () => {
    const { listar } = cenario();

    await expect(listar.execute(SEM_PLANTIO, { pagina: 1, tamanho: 20 })).resolves.toEqual({
      itens: [],
      total: 0,
      pagina: 1,
      tamanho: 20,
    });
  });

  it('recorta a página pedida e conta o total da Propriedade, não o da fatia', async () => {
    const { registrar, listar } = cenario();
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: CAFE, safraId: SAFRA_2026 });
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: MILHO, safraId: SAFRA_2026 });
    await registrar.execute({ propriedadeId: PROPRIEDADE, culturaId: SOJA, safraId: SAFRA_2026 });

    const segunda = await listar.execute(PROPRIEDADE, { pagina: 2, tamanho: 2 });

    expect(segunda.itens.map((plantio) => plantio.culturaId)).toEqual([SOJA]);
    expect(segunda).toMatchObject({ total: 3, pagina: 2, tamanho: 2 });
  });
});
