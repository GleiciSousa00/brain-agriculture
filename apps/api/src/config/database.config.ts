import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';
import { ORM_ENTITIES, ORM_MIGRATIONS } from './entities';

/**
 * Tempo máximo de uma consulta servida a uma requisição, em milissegundos.
 *
 * Uma consulta que passa disto já perdeu: quem pediu foi embora, e ela continua ocupando
 * conexão. O Postgres a interrompe, o erro sobe, e a resposta sai no formato de sempre com
 * o identificador de correlação para achar a consulta no log.
 *
 * O teto vale também para as migrações, que rodam por este mesmo pool. Uma migração que
 * precise de mais tempo, como criar índice em tabela grande, precisa levantá-lo para si com
 * `SET statement_timeout` na própria migração. O mesmo vale para os comandos de carga, que
 * fazem isso numa conexão só deles.
 */
const TEMPO_MAXIMO_DE_CONSULTA_MS = 15_000;

/**
 * Quantas conexões o pool guarda, e quanto uma requisição espera por uma delas.
 *
 * Os dois números são o padrão do driver, escritos aqui porque são eles que decidem o que
 * acontece quando chega mais carga do que o banco aguenta: as requisições excedentes
 * esperam, e depois falham rápido, em vez de se acumularem sem limite.
 */
const CONEXOES = 10;
const ESPERA_POR_CONEXAO_MS = 5_000;

/** A partir daqui a consulta é lenta e vira linha de log. */
const CONSULTA_LENTA_MS = 1_000;

/**
 * Conexão com o Postgres.
 *
 * `synchronize` fica desligado de propósito: o esquema muda por migração explícita, nunca
 * por inferência do ORM. As migrações rodam no arranque, para que subir a composição com um
 * comando deixe o banco pronto.
 */
export function databaseOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('POSTGRES_HOST', 'localhost'),
    port: Number(config.get<string>('POSTGRES_PORT', '5432')),
    username: config.get<string>('POSTGRES_USER', 'cadastro'),
    password: config.get<string>('POSTGRES_PASSWORD', 'cadastro'),
    database: config.get<string>('POSTGRES_DB', 'cadastro_rural'),
    synchronize: false,
    entities: ORM_ENTITIES,
    migrations: ORM_MIGRATIONS,
    migrationsRun: true,
    // O banco pode demorar a aceitar conexão quando sobe junto com a API.
    retryAttempts: 10,
    retryDelay: 3_000,
    maxQueryExecutionTime: CONSULTA_LENTA_MS,
    // O que o driver do Postgres recebe direto. É aqui que moram os freios: nenhuma
    // consulta corre para sempre, e nenhuma fila de espera por conexão cresce sem limite.
    extra: {
      statement_timeout: TEMPO_MAXIMO_DE_CONSULTA_MS,
      max: CONEXOES,
      connectionTimeoutMillis: ESPERA_POR_CONEXAO_MS,
    },
  };
}
