import { AcrescentarCulturaUseCase } from './acrescentar-cultura.use-case';
import { CulturaDuplicada, NomeDeCulturaInvalido } from '../domain/cultura.errors';
import { CulturaRepositoryEmMemoria } from './__fakes__/cultura-repository-em-memoria';
import { ListarCulturasUseCase } from './listar-culturas.use-case';

function cenario() {
  const repository = new CulturaRepositoryEmMemoria();

  return {
    repository,
    acrescentar: new AcrescentarCulturaUseCase(repository),
    listar: new ListarCulturasUseCase(repository),
  };
}

describe('AcrescentarCulturaUseCase', () => {
  it('acrescenta uma espécie nova ao catálogo', async () => {
    const { acrescentar, repository } = cenario();

    const cultura = await acrescentar.execute({ nome: 'Soja' });

    expect(cultura.nome).toBe('Soja');
    await expect(repository.findByChave('soja')).resolves.toBe(cultura);
  });

  it.each([
    ['a mesma, em caixa diferente', 'SOJA'],
    ['a mesma, sem acento', 'Feijao'],
    ['a mesma, com espaço em volta', ' Soja '],
  ])('recusa %s como duplicada', async (_caso, nome) => {
    const { acrescentar } = cenario();
    await acrescentar.execute({ nome: 'Soja' });
    await acrescentar.execute({ nome: 'Feijão' });

    await expect(acrescentar.execute({ nome })).rejects.toThrow(CulturaDuplicada);
  });

  it('aceita espécie diferente', async () => {
    const { acrescentar } = cenario();
    await acrescentar.execute({ nome: 'Soja' });

    await expect(acrescentar.execute({ nome: 'Milho' })).resolves.toMatchObject({ nome: 'Milho' });
  });

  it('recusa nome em branco antes de tocar no repositório', async () => {
    const { acrescentar, repository } = cenario();
    const save = jest.spyOn(repository, 'save');

    await expect(acrescentar.execute({ nome: '  ' })).rejects.toThrow(NomeDeCulturaInvalido);
    expect(save).not.toHaveBeenCalled();
  });
});

describe('ListarCulturasUseCase', () => {
  it('devolve o catálogo em ordem alfabética', async () => {
    const { acrescentar, listar } = cenario();
    await acrescentar.execute({ nome: 'Soja' });
    await acrescentar.execute({ nome: 'Algodão' });
    await acrescentar.execute({ nome: 'Milho' });

    const culturas = await listar.execute();

    expect(culturas.map((cultura) => cultura.nome)).toEqual(['Algodão', 'Milho', 'Soja']);
  });
});
