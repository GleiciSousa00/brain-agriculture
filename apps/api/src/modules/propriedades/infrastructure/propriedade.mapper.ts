import { Area } from '../domain/area';
import { Propriedade } from '../domain/propriedade';
import { PropriedadeOrmEntity } from './propriedade.orm-entity';

export function propriedadeParaLinha(propriedade: Propriedade): PropriedadeOrmEntity {
  const linha = new PropriedadeOrmEntity();
  linha.id = propriedade.id;
  linha.produtorId = propriedade.produtorId;
  linha.nome = propriedade.nome;
  linha.cidade = propriedade.cidade;
  linha.estado = propriedade.estado;
  linha.areaTotal = String(propriedade.areaTotal.hectares);
  linha.areaAgricultavel = String(propriedade.areaAgricultavel.hectares);
  linha.areaDeVegetacao = String(propriedade.areaDeVegetacao.hectares);

  return linha;
}

/** A volta usa `restaurar` nos dois níveis: ler não é hora de reaplicar regra de escrita. */
export function propriedadeParaDominio(linha: PropriedadeOrmEntity): Propriedade {
  return Propriedade.restaurar({
    id: linha.id,
    produtorId: linha.produtorId,
    nome: linha.nome,
    cidade: linha.cidade,
    estado: linha.estado,
    areaTotal: Area.restaurar(Number(linha.areaTotal)),
    areaAgricultavel: Area.restaurar(Number(linha.areaAgricultavel)),
    areaDeVegetacao: Area.restaurar(Number(linha.areaDeVegetacao)),
  });
}
