import { BuscarProdutorUseCase } from './buscar-produtor.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';

describe('BuscarProdutorUseCase', () => {
  it('devolve o Produtor gravado', async () => {
    const repository = new ProdutorRepositoryEmMemoria();
    const produtor = Produtor.criar({
      documento: Documento.criar('529.982.247-25'),
      nome: 'Maria da Silva',
    });
    await repository.save(produtor);

    await expect(new BuscarProdutorUseCase(repository).execute(produtor.id)).resolves.toBe(
      produtor,
    );
  });

  it('recusa identificador que não existe', async () => {
    const useCase = new BuscarProdutorUseCase(new ProdutorRepositoryEmMemoria());

    await expect(useCase.execute('0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b')).rejects.toThrow(
      ProdutorNaoEncontrado,
    );
  });
});
