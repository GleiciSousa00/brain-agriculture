import type { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import { Plantio } from '../domain/plantio';
import {
  CulturaDoPlantioNaoEncontrada,
  PlantioDuplicado,
  PropriedadeDoPlantioNaoEncontrada,
  SafraDoPlantioNaoEncontrada,
} from '../domain/plantio.errors';
import type { PlantioOrmEntity } from './plantio.orm-entity';
import { TypeormPlantioRepository } from './typeorm-plantio.repository';

const PLANTIO = Plantio.criar({
  propriedadeId: '3f1b7e5c-0a4d-4c8e-9a11-6b2c8d5e7f01',
  culturaId: '7c2d9a1e-5b3f-4e6a-8d02-1f4b6c8e9a23',
  safraId: 'b5e8d3c1-2a6f-4907-9c4b-8e1d3f5a7c69',
});

function falha(code: string, constraint?: string): QueryFailedError {
  return new QueryFailedError('INSERT', [], Object.assign(new Error('falhou'), { code, constraint }));
}

/** Um repositório do ORM que só sabe rejeitar, que é o que esta tradução precisa. */
function repositorioQueRejeitaCom(erro: unknown): TypeormPlantioRepository {
  const linhas = { insert: () => Promise.reject(erro) } as unknown as Repository<PlantioOrmEntity>;

  return new TypeormPlantioRepository(linhas);
}

describe('TypeormPlantioRepository, ao gravar', () => {
  it('traduz a violação de unicidade para o Plantio repetido', async () => {
    const repository = repositorioQueRejeitaCom(falha('23505', 'uq_plantios_ligacao'));

    await expect(repository.save(PLANTIO)).rejects.toThrow(PlantioDuplicado);
  });

  it.each([
    ['fk_plantios_propriedade', PropriedadeDoPlantioNaoEncontrada],
    ['fk_plantios_cultura', CulturaDoPlantioNaoEncontrada],
    ['fk_plantios_safra', SafraDoPlantioNaoEncontrada],
  ])('diz qual referência falta quando %s é violada', async (restricao, esperado) => {
    const repository = repositorioQueRejeitaCom(falha('23503', restricao));

    await expect(repository.save(PLANTIO)).rejects.toThrow(esperado);
  });

  it('deixa subir o que não é violação que este módulo declarou', async () => {
    const outro = falha('23503', 'fk_de_outra_tabela');
    const repository = repositorioQueRejeitaCom(outro);

    await expect(repository.save(PLANTIO)).rejects.toBe(outro);
  });
});
