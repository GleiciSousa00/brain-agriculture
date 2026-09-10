import { AnoDeSafraInvalido, SafraDuplicada } from '../domain/safra.errors';
import { CriarSafraUseCase } from './criar-safra.use-case';
import { ListarSafrasUseCase } from './listar-safras.use-case';
import { SafraRepositoryEmMemoria } from './__fakes__/safra-repository-em-memoria';

function cenario() {
  const repository = new SafraRepositoryEmMemoria();

  return {
    repository,
    criar: new CriarSafraUseCase(repository),
    listar: new ListarSafrasUseCase(repository),
  };
}

describe('CriarSafraUseCase', () => {
  it('grava a Safra do ano informado', async () => {
    const { criar, repository } = cenario();

    const safra = await criar.execute({ ano: 2026 });

    expect(safra.ano).toBe(2026);
    await expect(repository.findByAno(2026)).resolves.toBe(safra);
  });

  it('recusa um segundo registro para o mesmo ano', async () => {
    const { criar } = cenario();
    await criar.execute({ ano: 2026 });

    await expect(criar.execute({ ano: 2026 })).rejects.toThrow(SafraDuplicada);
  });

  it('recusa ano fora da faixa antes de tocar no repositório', async () => {
    const { criar, repository } = cenario();
    const save = jest.spyOn(repository, 'save');

    await expect(criar.execute({ ano: 1899 })).rejects.toThrow(AnoDeSafraInvalido);
    expect(save).not.toHaveBeenCalled();
  });

  it('a Safra não guarda referência a Propriedade nem a Produtor: ela é de todas', async () => {
    const { criar } = cenario();

    const safra = await criar.execute({ ano: 2026 });

    expect(Object.keys(safra).sort()).toEqual(['ano', 'id']);
  });
});

describe('ListarSafrasUseCase', () => {
  it('devolve as Safras da mais recente para a mais antiga', async () => {
    const { criar, listar } = cenario();
    await criar.execute({ ano: 2024 });
    await criar.execute({ ano: 2026 });
    await criar.execute({ ano: 2025 });

    const safras = await listar.execute();

    expect(safras.map((safra) => safra.ano)).toEqual([2026, 2025, 2024]);
  });

  it('devolve lista vazia quando não há nenhuma', async () => {
    await expect(cenario().listar.execute()).resolves.toEqual([]);
  });
});
