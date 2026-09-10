import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';
import { ORM_ENTITIES, ORM_MIGRATIONS } from './entities';

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
  };
}
