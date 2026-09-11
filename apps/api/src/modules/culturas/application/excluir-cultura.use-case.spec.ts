import { AcrescentarCulturaUseCase } from './acrescentar-cultura.use-case';
import { CulturaEmUso, CulturaNaoEncontrada } from '../domain/cultura.errors';
import { CulturaRepositoryEmMemoria } from './__fakes__/cultura-repository-em-memoria';
import { ExcluirCulturaUseCase } from './excluir-cultura.use-case';
import { ListarCulturasUseCase } from './listar-culturas.use-case';

const INEXISTENTE = '00000000-0000-4000-8000-000000000000';

function cenario() {
  const repository = new CulturaRepositoryEmMemoria();

  return {
    repository,
    acrescentar: new AcrescentarCulturaUseCase(repository),
    excluir: new ExcluirCulturaUseCase(repository),
    listar: new ListarCulturasUseCase(repository),
  };
}

describe('ExcluirCulturaUseCase', () => {
  it('tira do catálogo a espécie que ninguém plantou', async () => {
    const { acrescentar, excluir, listar } = cenario();
    const cultura = await acrescentar.execute({ nome: 'Soja' });

    await excluir.execute(cultura.id);

    await expect(listar.execute()).resolves.toEqual([]);
  });

  it('recusa identificador que não existe', async () => {
    const { excluir } = cenario();

    await expect(excluir.execute(INEXISTENTE)).rejects.toThrow(CulturaNaoEncontrada);
  });

  it('recusa a espécie que algum Plantio aponta', async () => {
    const { acrescentar, excluir, repository } = cenario();
    const cultura = await acrescentar.execute({ nome: 'Soja' });
    repository.plantar(cultura.id);

    await expect(excluir.execute(cultura.id)).rejects.toThrow(CulturaEmUso);
  });

  it('deixa a espécie plantada no catálogo depois da recusa', async () => {
    const { acrescentar, excluir, listar, repository } = cenario();
    const cultura = await acrescentar.execute({ nome: 'Soja' });
    repository.plantar(cultura.id);

    await expect(excluir.execute(cultura.id)).rejects.toThrow(CulturaEmUso);

    await expect(listar.execute()).resolves.toEqual([cultura]);
  });

  it('não toca no repositório quando o identificador não existe', async () => {
    const { excluir, repository } = cenario();
    const apagar = jest.spyOn(repository, 'delete');

    await expect(excluir.execute(INEXISTENTE)).rejects.toThrow(CulturaNaoEncontrada);
    expect(apagar).not.toHaveBeenCalled();
  });

  it('deixa as outras espécies onde estão', async () => {
    const { acrescentar, excluir, listar } = cenario();
    const soja = await acrescentar.execute({ nome: 'Soja' });
    await acrescentar.execute({ nome: 'Milho' });

    await excluir.execute(soja.id);

    await expect(listar.execute()).resolves.toMatchObject([{ nome: 'Milho' }]);
  });
});
