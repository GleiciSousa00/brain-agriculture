import { CULTURAS_ENTIDADES, CULTURAS_MIGRACOES } from '../modules/culturas/culturas.module';
import { PAINEL_MIGRACOES } from '../modules/painel/painel.module';
import { PLANTIOS_ENTIDADES, PLANTIOS_MIGRACOES } from '../modules/plantios/plantios.module';
import { PRODUTORES_ENTIDADES, PRODUTORES_MIGRACOES } from '../modules/produtores/produtores.module';
import {
  PROPRIEDADES_ENTIDADES,
  PROPRIEDADES_MIGRACOES,
} from '../modules/propriedades/propriedades.module';
import { SAFRAS_ENTIDADES, SAFRAS_MIGRACOES } from '../modules/safras/safras.module';
import { PreparaBuscaPorTexto1789110000000 } from '../shared/infrastructure/migrations/1789110000000-prepara-busca-por-texto';

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
 *
 * A ordem deste vetor não é a de execução: quem ordena é o ORM, pelo carimbo de tempo do
 * nome da classe. O vetor só precisa estar completo, e é agrupado por módulo, na mesma
 * ordem do catálogo de entidades, para ser lido. O módulo de Produtor tem duas migrações
 * com carimbos que cercam os dos outros módulos, e por isso agrupar e executar em ordem
 * de carimbo não são a mesma coisa.
 *
 * A primeira não é de módulo nenhum: ela prepara a busca por texto, de que os índices de
 * Produtor e de Propriedade dependem, e por isso não pertence a um dos dois.
 */
export const ORM_ENTITIES = [
  ...PRODUTORES_ENTIDADES,
  ...PROPRIEDADES_ENTIDADES,
  ...SAFRAS_ENTIDADES,
  ...CULTURAS_ENTIDADES,
  ...PLANTIOS_ENTIDADES,
];

export const ORM_MIGRATIONS = [
  PreparaBuscaPorTexto1789110000000,
  ...PRODUTORES_MIGRACOES,
  ...PROPRIEDADES_MIGRACOES,
  ...SAFRAS_MIGRACOES,
  ...CULTURAS_MIGRACOES,
  ...PLANTIOS_MIGRACOES,
  ...PAINEL_MIGRACOES,
];
