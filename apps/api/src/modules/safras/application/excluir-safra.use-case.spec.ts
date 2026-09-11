import { CriarSafraUseCase } from './criar-safra.use-case';
import { ExcluirSafraUseCase } from './excluir-safra.use-case';
import { ListarSafrasUseCase } from './listar-safras.use-case';
import { SafraEmUso, SafraNaoEncontrada } from '../domain/safra.errors';
import { SafraRepositoryEmMemoria } from './__fakes__/safra-repository-em-memoria';

const INEXISTENTE = '00000000-0000-4000-8000-000000000000';

function cenario() {
  const repository = new SafraRepositoryEmMemoria();

  return {
    repository,
    criar: new CriarSafraUseCase(repository),
    excluir: new ExcluirSafraUseCase(repository),
    listar: new ListarSafrasUseCase(repository),
  };
}

describe('ExcluirSafraUseCase', () => {
  it('tira do cadastro a Safra sem Plantio', async () => {
    const { criar, excluir, listar } = cenario();
    const safra = await criar.execute({ ano: 2024 });

    await excluir.execute(safra.id);

    await expect(listar.execute()).resolves.toEqual([]);
  });

  it('recusa identificador que não existe', async () => {
    const { excluir } = cenario();

    await expect(excluir.execute(INEXISTENTE)).rejects.toThrow(SafraNaoEncontrada);
  });

  it('recusa a Safra que tem Plantio registrado nela', async () => {
    const { criar, excluir, repository } = cenario();
    const safra = await criar.execute({ ano: 2024 });
    repository.plantar(safra.id);

    await expect(excluir.execute(safra.id)).rejects.toThrow(SafraEmUso);
  });

  it('deixa a Safra com Plantio no cadastro depois da recusa', async () => {
    const { criar, excluir, listar, repository } = cenario();
    const safra = await criar.execute({ ano: 2024 });
    repository.plantar(safra.id);

    await expect(excluir.execute(safra.id)).rejects.toThrow(SafraEmUso);

    await expect(listar.execute()).resolves.toEqual([safra]);
  });

  it('não toca no repositório quando o identificador não existe', async () => {
    const { excluir, repository } = cenario();
    const apagar = jest.spyOn(repository, 'delete');

    await expect(excluir.execute(INEXISTENTE)).rejects.toThrow(SafraNaoEncontrada);
    expect(apagar).not.toHaveBeenCalled();
  });

  it('libera o ano para ser registrado outra vez', async () => {
    const { criar, excluir } = cenario();
    const safra = await criar.execute({ ano: 2024 });
    await excluir.execute(safra.id);

    await expect(criar.execute({ ano: 2024 })).resolves.toMatchObject({ ano: 2024 });
  });
});
