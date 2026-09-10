import { Safra } from '../domain/safra';
import { SafraOrmEntity } from './safra.orm-entity';

export function safraParaLinha(safra: Safra): SafraOrmEntity {
  const linha = new SafraOrmEntity();
  linha.id = safra.id;
  linha.ano = safra.ano;

  return linha;
}

export function safraParaDominio(linha: SafraOrmEntity): Safra {
  return Safra.restaurar({ id: linha.id, ano: linha.ano });
}
