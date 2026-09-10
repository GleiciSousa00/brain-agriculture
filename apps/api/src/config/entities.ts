import { PRODUTORES_ENTIDADES, PRODUTORES_MIGRACOES } from '../modules/produtores/produtores.module';

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
 * encontrada é uma migração que não roda.
 */
export const ORM_ENTITIES = [...PRODUTORES_ENTIDADES];

export const ORM_MIGRATIONS = [...PRODUTORES_MIGRACOES];
