import { CULTURAS_ENTIDADES, CULTURAS_MIGRACOES } from '../modules/culturas/culturas.module';
import { PRODUTORES_ENTIDADES, PRODUTORES_MIGRACOES } from '../modules/produtores/produtores.module';
import {
  PROPRIEDADES_ENTIDADES,
  PROPRIEDADES_MIGRACOES,
} from '../modules/propriedades/propriedades.module';
import { SAFRAS_ENTIDADES, SAFRAS_MIGRACOES } from '../modules/safras/safras.module';

/**
 * O catálogo do ORM, montado na raiz de composição.
 *
 * Ele junta o que cada módulo publica no próprio arquivo de módulo, e não enxerga camada
 * nenhuma: quem sabe onde mora a entidade de ORM de um módulo é o módulo. O registro 0005
 * diz que só o arquivo de módulo atravessa as quatro camadas, e é assim que ele continua
 * valendo aqui.
 *
 * A lista é explícita em vez de varrer pasta por padrão de nome porque, empacotada na
 * imagem, a varredura depende de onde os arquivos caíram, e uma migração que não é
 * encontrada é uma migração que não roda. A ordem das migrações é a de execução.
 */
export const ORM_ENTITIES = [
  ...PRODUTORES_ENTIDADES,
  ...PROPRIEDADES_ENTIDADES,
  ...SAFRAS_ENTIDADES,
  ...CULTURAS_ENTIDADES,
];

export const ORM_MIGRATIONS = [
  ...PRODUTORES_MIGRACOES,
  ...SAFRAS_MIGRACOES,
  ...CULTURAS_MIGRACOES,
  ...PROPRIEDADES_MIGRACOES,
];
