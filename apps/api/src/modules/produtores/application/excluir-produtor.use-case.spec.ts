import { ExcluirProdutorUseCase } from './excluir-produtor.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';

const INEXISTENTE = '0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

async function cenario() {
  const produtores = new ProdutorRepositoryEmMemoria();

  const maria = Produtor.criar({
    documento: Documento.criar('52998224725'),
    nome: 'Maria da Silva',
  });
  await produtores.save(maria);

  return { produtores, maria, useCase: new ExcluirProdutorUseCase(produtores) };
}

describe('ExcluirProdutorUseCase', () => {
  it('apaga o Produtor do cadastro', async () => {
    const { useCase, produtores, maria } = await cenario();

    await useCase.execute(maria.id);

    await expect(produtores.findById(maria.id)).resolves.toBeNull();
  });

  it('recusa excluir Produtor que não existe', async () => {
    const { useCase } = await cenario();

    await expect(useCase.execute(INEXISTENTE)).rejects.toThrow(ProdutorNaoEncontrado);
  });
});
