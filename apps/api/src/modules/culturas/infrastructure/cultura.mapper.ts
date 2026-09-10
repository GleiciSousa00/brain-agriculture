import { Cultura } from '../domain/cultura';
import { CulturaOrmEntity } from './cultura.orm-entity';

export function culturaParaLinha(cultura: Cultura): CulturaOrmEntity {
  const linha = new CulturaOrmEntity();
  linha.id = cultura.id;
  linha.nome = cultura.nome;
  linha.chave = cultura.chave;

  return linha;
}

export function culturaParaDominio(linha: CulturaOrmEntity): Cultura {
  return Cultura.restaurar({ id: linha.id, nome: linha.nome });
}
