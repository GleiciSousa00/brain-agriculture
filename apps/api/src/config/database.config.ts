import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { ConfigService } from '@nestjs/config';

/**
 * Conexão com o Postgres.
 *
 * `synchronize` fica desligado de propósito: o esquema muda por migração explícita, nunca
 * por inferência do ORM. As entidades chegam com o cadastro; por ora não há nenhuma.
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
    autoLoadEntities: true,
    migrationsRun: false,
    // O banco pode demorar a aceitar conexão quando sobe junto com a API.
    retryAttempts: 10,
    retryDelay: 3_000,
  };
}
