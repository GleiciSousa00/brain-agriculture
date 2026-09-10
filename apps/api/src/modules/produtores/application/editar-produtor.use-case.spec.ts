import { EditarProdutorUseCase } from './editar-produtor.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { NomeDeProdutorInvalido, ProdutorNaoEncontrado } from '../domain/produtor.errors';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';

const CPF = '52998224725';
const INEXISTENTE = '0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

async function cenario() {
  const repository = new ProdutorRepositoryEmMemoria();
  const produtor = Produtor.criar({ documento: Documento.criar(CPF), nome: 'Maria da Silva' });
  await repository.save(produtor);

  return { repository, produtor, useCase: new EditarProdutorUseCase(repository) };
}

describe('EditarProdutorUseCase', () => {
  it('corrige o nome sem recadastrar', async () => {
    const { useCase, repository, produtor } = await cenario();

    const editado = await useCase.execute({ id: produtor.id, nome: 'Maria da Silva Souza' });

    expect(editado.nome).toBe('Maria da Silva Souza');
    await expect(repository.findById(produtor.id)).resolves.toMatchObject({
      nome: 'Maria da Silva Souza',
    });
  });

  it('mantém o Documento, que identifica o Produtor e não é editável', async () => {
    const { useCase, produtor } = await cenario();

    const editado = await useCase.execute({ id: produtor.id, nome: 'Outro Nome' });

    expect(editado.documento.valor).toBe(CPF);
    expect(editado.id).toBe(produtor.id);
  });

  it('recusa nome em branco, com a mesma regra da criação', async () => {
    const { useCase, repository, produtor } = await cenario();

    await expect(useCase.execute({ id: produtor.id, nome: '   ' })).rejects.toThrow(
      NomeDeProdutorInvalido,
    );
    await expect(repository.findById(produtor.id)).resolves.toMatchObject({
      nome: 'Maria da Silva',
    });
  });

  it('recusa editar Produtor que não existe', async () => {
    const { useCase } = await cenario();

    await expect(useCase.execute({ id: INEXISTENTE, nome: 'Qualquer' })).rejects.toThrow(
      ProdutorNaoEncontrado,
    );
  });
});
