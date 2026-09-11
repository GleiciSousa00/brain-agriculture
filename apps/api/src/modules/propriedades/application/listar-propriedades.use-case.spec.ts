import { Area } from '../domain/area';
import { Propriedade } from '../domain/propriedade';
import { ListarPropriedadesUseCase } from './listar-propriedades.use-case';
import { PropriedadeRepositoryEmMemoria } from './__fakes__/propriedade-repository-em-memoria';

const PRODUTOR_ID = '3f2f0c8e-6a1e-4a2b-9f0e-0f0a1b2c3d4e';

function propriedadeChamada(nome: string): Propriedade {
  return Propriedade.criar({
    produtorId: PRODUTOR_ID,
    nome,
    cidade: 'Sorriso',
    estado: 'MT',
    areaTotal: Area.criar(10),
    areaAgricultavel: Area.criar(5),
    areaDeVegetacao: Area.criar(5),
  });
}

async function cenarioCom(quantas: number) {
  const repository = new PropriedadeRepositoryEmMemoria();

  for (let indice = 0; indice < quantas; indice += 1) {
    await repository.save(
      Propriedade.criar({
        produtorId: PRODUTOR_ID,
        nome: `Fazenda ${indice}`,
        cidade: 'Sorriso',
        estado: 'MT',
        areaTotal: Area.criar(10),
        areaAgricultavel: Area.criar(5),
        areaDeVegetacao: Area.criar(5),
      }),
    );
  }

  return { repository, useCase: new ListarPropriedadesUseCase(repository) };
}

describe('ListarPropriedadesUseCase', () => {
  it('devolve só a fatia pedida e o total do cadastro inteiro', async () => {
    const { useCase } = await cenarioCom(5);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 2 });

    expect(pagina.itens).toHaveLength(2);
    expect(pagina.total).toBe(5);
    expect(pagina.pagina).toBe(1);
    expect(pagina.tamanho).toBe(2);
  });

  it('a segunda página continua de onde a primeira parou', async () => {
    const { useCase } = await cenarioCom(5);

    const primeira = await useCase.execute({ pagina: 1, tamanho: 2 });
    const segunda = await useCase.execute({ pagina: 2, tamanho: 2 });

    expect(segunda.itens.map((item) => item.id)).not.toEqual(primeira.itens.map((item) => item.id));
  });

  it('lista em ordem de nome, que é a ordem que o repositório promete', async () => {
    const { repository, useCase } = await cenarioCom(0);
    await repository.save(propriedadeChamada('Fazenda Santa Rita'));
    await repository.save(propriedadeChamada('Fazenda Boa Vista'));
    await repository.save(propriedadeChamada('Fazenda Cana Brava'));

    const pagina = await useCase.execute({ pagina: 1, tamanho: 10 });

    expect(pagina.itens.map((propriedade) => propriedade.nome)).toEqual([
      'Fazenda Boa Vista',
      'Fazenda Cana Brava',
      'Fazenda Santa Rita',
    ]);
  });

  it('desempata homônimas pelo identificador', async () => {
    const { repository, useCase } = await cenarioCom(0);
    const uma = propriedadeChamada('Fazenda Boa Vista');
    const outra = propriedadeChamada('Fazenda Boa Vista');
    await repository.save(uma);
    await repository.save(outra);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 10 });

    expect(pagina.itens.map((propriedade) => propriedade.id)).toEqual([uma.id, outra.id].sort());
  });

  it('recorta pelo pedaço do nome procurado, e o total passa a ser o do recorte', async () => {
    const { repository, useCase } = await cenarioCom(0);
    await repository.save(propriedadeChamada('Fazenda Boa Vista'));
    await repository.save(propriedadeChamada('Sítio Boa Esperança'));
    await repository.save(propriedadeChamada('Fazenda Cana Brava'));

    const pagina = await useCase.execute({ pagina: 1, tamanho: 10, busca: 'boa' });

    expect(pagina.itens.map((propriedade) => propriedade.nome)).toEqual([
      'Fazenda Boa Vista',
      'Sítio Boa Esperança',
    ]);
    expect(pagina.total).toBe(2);
  });

  it('ignora caixa e acento, porque quem procura digita sem eles', async () => {
    const { repository, useCase } = await cenarioCom(0);
    await repository.save(propriedadeChamada('Fazenda São José'));

    const pagina = await useCase.execute({ pagina: 1, tamanho: 10, busca: 'sao jose' });

    expect(pagina.itens.map((propriedade) => propriedade.nome)).toEqual(['Fazenda São José']);
  });

  it('sem busca, lista o cadastro inteiro', async () => {
    const { useCase } = await cenarioCom(5);

    const pagina = await useCase.execute({ pagina: 1, tamanho: 10 });

    expect(pagina.total).toBe(5);
  });

  it('a página além do fim vem vazia, e não em erro', async () => {
    const { useCase } = await cenarioCom(5);

    const pagina = await useCase.execute({ pagina: 9, tamanho: 2 });

    expect(pagina.itens).toEqual([]);
    expect(pagina.total).toBe(5);
  });
});
