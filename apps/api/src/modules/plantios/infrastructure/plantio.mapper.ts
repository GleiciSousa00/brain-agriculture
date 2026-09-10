import { Plantio } from '../domain/plantio';
import { PlantioOrmEntity } from './plantio.orm-entity';

export function plantioParaLinha(plantio: Plantio): PlantioOrmEntity {
  const linha = new PlantioOrmEntity();
  linha.id = plantio.id;
  linha.propriedadeId = plantio.propriedadeId;
  linha.culturaId = plantio.culturaId;
  linha.safraId = plantio.safraId;

  return linha;
}

/** A volta usa `restaurar`: ler não é hora de reaplicar regra de escrita. */
export function plantioParaDominio(linha: PlantioOrmEntity): Plantio {
  return Plantio.restaurar({
    id: linha.id,
    propriedadeId: linha.propriedadeId,
    culturaId: linha.culturaId,
    safraId: linha.safraId,
  });
}
