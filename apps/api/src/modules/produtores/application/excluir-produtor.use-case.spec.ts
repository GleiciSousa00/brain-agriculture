import { Area } from '../../propriedades/domain/area';
import { Propriedade } from '../../propriedades/domain/propriedade';
import { ExcluirProdutorUseCase } from './excluir-produtor.use-case';
import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import { PropriedadesDoProdutorEmMemoria } from './__fakes__/propriedades-do-produtor-em-memoria';
import { ProdutorRepositoryEmMemoria } from './__fakes__/produtor-repository-em-memoria';

const INEXISTENTE = '0b8b6f3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

function propriedadeDe(produtorId: string, cidade: string): Propriedade {
  return Propriedade.criar({
    produtorId,
    cidade,
    estado: 'MT',
    areaTotal: Area.criar(100),
    areaAgricultavel: Area.criar(60),
    areaDeVegetacao: Area.criar(30),
  });
}

async function cenario() {
  const produtores = new ProdutorRepositoryEmMemoria();
  const propriedades = new PropriedadesDoProdutorEmMemoria();

  const maria = Produtor.criar({
    documento: Documento.criar('52998224725'),
    nome: 'Maria da Silva',
  });
  const joao = Produtor.criar({ documento: Documento.criar('11144477735'), nome: 'João Prado' });
  await produtores.save(maria);
  await produtores.save(joao);

  propriedades.acrescentar(
    propriedadeDe(maria.id, 'Sorriso'),
    propriedadeDe(maria.id, 'Sinop'),
    propriedadeDe(joao.id, 'Bagé'),
  );

  return {
    produtores,
    propriedades,
    maria,
    joao,
    useCase: new ExcluirProdutorUseCase(produtores, propriedades),
  };
}

describe('ExcluirProdutorUseCase', () => {
  it('apaga o Produtor do cadastro', async () => {
    const { useCase, produtores, maria } = await cenario();

    await useCase.execute(maria.id);

    await expect(produtores.findById(maria.id)).resolves.toBeNull();
  });

  it('leva junto as Propriedades do Produtor, para não restar registro órfão', async () => {
    const { useCase, propriedades, maria } = await cenario();

    await useCase.execute(maria.id);

    await expect(propriedades.listByProdutor(maria.id)).resolves.toEqual([]);
  });

  it('não encosta no que é de outro Produtor', async () => {
    const { useCase, produtores, propriedades, maria, joao } = await cenario();

    await useCase.execute(maria.id);

    await expect(produtores.findById(joao.id)).resolves.not.toBeNull();
    const restantes = await propriedades.listByProdutor(joao.id);
    expect(restantes.map((propriedade) => propriedade.cidade)).toEqual(['Bagé']);
  });

  it('recusa excluir Produtor que não existe', async () => {
    const { useCase } = await cenario();

    await expect(useCase.execute(INEXISTENTE)).rejects.toThrow(ProdutorNaoEncontrado);
  });

  it('não exclui Propriedade nenhuma quando o Produtor não existe', async () => {
    const { useCase, propriedades, maria } = await cenario();

    await expect(useCase.execute(INEXISTENTE)).rejects.toThrow(ProdutorNaoEncontrado);
    await expect(propriedades.listByProdutor(maria.id)).resolves.toHaveLength(2);
  });
});
