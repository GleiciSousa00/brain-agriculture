import { CriarProdutorUseCase } from './criar-produtor.use-case';
import { DocumentoInvalido } from '../domain/documento.errors';
import { NomeDeProdutorInvalido, ProdutorDuplicado } from '../domain/produtor.errors';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';

const CPF = '529.982.247-25';

function cenario() {
  const repository = new ProdutorRepositoryEmMemoria();

  return { repository, useCase: new CriarProdutorUseCase(repository) };
}

describe('CriarProdutorUseCase', () => {
  it('grava o Produtor e devolve o que foi gravado', async () => {
    const { useCase, repository } = cenario();

    const produtor = await useCase.execute({ documento: CPF, nome: 'Maria da Silva' });

    expect(produtor.nome).toBe('Maria da Silva');
    await expect(repository.findById(produtor.id)).resolves.toBe(produtor);
  });

  it('aceita o Documento com ou sem máscara e grava sem', async () => {
    const { useCase } = cenario();

    const produtor = await useCase.execute({ documento: CPF, nome: 'Maria da Silva' });

    expect(produtor.documento.valor).toBe('52998224725');
  });

  it('recusa um segundo Produtor com o mesmo Documento', async () => {
    const { useCase } = cenario();
    await useCase.execute({ documento: CPF, nome: 'Maria da Silva' });

    await expect(useCase.execute({ documento: '52998224725', nome: 'Outra' })).rejects.toThrow(
      ProdutorDuplicado,
    );
  });

  it('recusa Documento inválido antes de tocar no repositório', async () => {
    const { useCase, repository } = cenario();
    const save = jest.spyOn(repository, 'save');

    await expect(
      useCase.execute({ documento: '529.982.247-26', nome: 'Maria da Silva' }),
    ).rejects.toThrow(DocumentoInvalido);
    expect(save).not.toHaveBeenCalled();
  });

  it('recusa nome em branco', async () => {
    const { useCase } = cenario();

    await expect(useCase.execute({ documento: CPF, nome: '  ' })).rejects.toThrow(
      NomeDeProdutorInvalido,
    );
  });
});
