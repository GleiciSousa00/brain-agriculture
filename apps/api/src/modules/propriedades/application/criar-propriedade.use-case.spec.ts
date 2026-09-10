import {
  AreasNaoFecham,
  EstadoInvalido,
  NomeDePropriedadeInvalido,
} from '../domain/propriedade.errors';
import { CriarPropriedadeUseCase } from './criar-propriedade.use-case';
import { PropriedadeRepositoryEmMemoria } from './__fakes__/propriedade-repository-em-memoria';

const PRODUTOR_ID = '3f2f0c8e-6a1e-4a2b-9f0e-0f0a1b2c3d4e';

function cenario() {
  const repository = new PropriedadeRepositoryEmMemoria();

  return { repository, useCase: new CriarPropriedadeUseCase(repository) };
}

const entrada = {
  produtorId: PRODUTOR_ID,
  nome: 'Fazenda Boa Vista',
  cidade: 'Sorriso',
  estado: 'MT',
  areaTotal: 100,
  areaAgricultavel: 60,
  areaDeVegetacao: 30,
};

describe('CriarPropriedadeUseCase', () => {
  it('grava a Propriedade e devolve o que foi gravado', async () => {
    const { useCase, repository } = cenario();

    const propriedade = await useCase.execute(entrada);

    expect(propriedade.nome).toBe('Fazenda Boa Vista');
    expect(propriedade.cidade).toBe('Sorriso');
    expect(propriedade.produtorId).toBe(PRODUTOR_ID);
    await expect(repository.findById(propriedade.id)).resolves.toBe(propriedade);
  });

  it('recusa quando a soma das áreas passa da Área Total, sem tocar no repositório', async () => {
    const { useCase, repository } = cenario();
    const save = jest.spyOn(repository, 'save');

    await expect(useCase.execute({ ...entrada, areaDeVegetacao: 60 })).rejects.toThrow(
      AreasNaoFecham,
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('aceita a soma igual à Área Total', async () => {
    const { useCase } = cenario();

    const propriedade = await useCase.execute({ ...entrada, areaAgricultavel: 70 });

    expect(propriedade.areaAgricultavel.hectares).toBe(70);
  });

  it('recusa estado que não é unidade federativa', async () => {
    const { useCase } = cenario();

    await expect(useCase.execute({ ...entrada, estado: 'XX' })).rejects.toThrow(EstadoInvalido);
  });

  it('recusa nome em branco, sem tocar no repositório', async () => {
    const { useCase, repository } = cenario();
    const save = jest.spyOn(repository, 'save');

    await expect(useCase.execute({ ...entrada, nome: '   ' })).rejects.toThrow(
      NomeDePropriedadeInvalido,
    );
    expect(save).not.toHaveBeenCalled();
  });
});
