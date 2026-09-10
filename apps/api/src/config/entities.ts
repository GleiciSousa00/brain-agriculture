import { ProdutorOrmEntity } from '../modules/produtores/infrastructure/produtor.orm-entity';
import { CriaProdutores1789040000000 } from '../modules/produtores/infrastructure/migrations/1789040000000-cria-produtores';

/**
 * O catálogo do ORM, no único lugar que enxerga todos os módulos.
 *
 * Ele é explícito em vez de varrer pasta por padrão de nome porque, empacotado na imagem,
 * a varredura depende de onde os arquivos caíram, e uma migração que não é encontrada é
 * uma migração que não roda.
 */
export const ORM_ENTITIES = [ProdutorOrmEntity];

export const ORM_MIGRATIONS = [CriaProdutores1789040000000];
