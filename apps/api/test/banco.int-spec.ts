import { randomBytes } from 'node:crypto';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { chaveDe } from '../src/modules/culturas/domain/cultura';
import { CULTURAS_INICIAIS } from '../src/modules/culturas/infrastructure/culturas-iniciais';
import { Documento } from '../src/modules/produtores/domain/documento';
import { Produtor } from '../src/modules/produtores/domain/produtor';
import {
  PRODUTOR_REPOSITORY,
  type ProdutorRepository,
} from '../src/modules/produtores/domain/produtor.repository';
import { ProdutorDuplicado } from '../src/modules/produtores/domain/produtor.errors';

/**
 * A suíte de contêiner é pequena de propósito. Ela cobre só o que apenas o banco prova: que
 * a migração criou o esquema, que a cifra vai e volta, e que a restrição de unicidade
 * recusa o Documento repetido. Regra de negócio é assunto dos testes de unidade, que rodam
 * sem Docker e em milissegundos.
 */
describe('A aplicação contra um Postgres de verdade', () => {
  let postgres: StartedPostgreSqlContainer;
  let app: INestApplication;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:17-alpine').start();

    process.env.POSTGRES_HOST = postgres.getHost();
    process.env.POSTGRES_PORT = String(postgres.getPort());
    process.env.POSTGRES_USER = postgres.getUsername();
    process.env.POSTGRES_PASSWORD = postgres.getPassword();
    process.env.POSTGRES_DB = postgres.getDatabase();
    process.env.DOCUMENTO_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    process.env.DOCUMENTO_FINGERPRINT_SECRET = randomBytes(32).toString('base64');

    const testingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = testingModule.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    await app.init();
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    await postgres?.stop();
  });

  it('as migrações criaram o esquema e semearam o catálogo, sem sincronização automática', async () => {
    const dataSource = app.get(DataSource);

    const colunas: { column_name: string }[] = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'produtores'`,
    );
    const catalogo: { nome: string }[] = await dataSource.query(
      `SELECT nome FROM culturas ORDER BY chave`,
    );
    const safras: { column_name: string }[] = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'safras'`,
    );

    expect(dataSource.options.synchronize).toBe(false);
    expect(colunas.map((coluna) => coluna.column_name).sort()).toEqual([
      'criado_em',
      'documento_cifrado',
      'documento_impressao',
      'id',
      'nome',
    ]);
    expect(safras.map((coluna) => coluna.column_name).sort()).toEqual(['ano', 'criado_em', 'id']);
    expect(catalogo.map((cultura) => cultura.nome)).toEqual(
      [...CULTURAS_INICIAIS].sort((um, outro) => (chaveDe(um) < chaveDe(outro) ? -1 : 1)),
    );
  });

  it.each([
    ['CPF', '529.982.247-25', '52998224725', '***.***.247-25'],
    ['CNPJ alfanumérico', '12.ABC.345/01DE-35', '12ABC34501DE35', '**.***.***/01DE-35'],
  ])(
    'grava o %s cifrado e o lê de volta, sem nenhuma coluna em claro',
    async (_tipo, informado, semMascara, mascarado) => {
      const criacao = await request(app.getHttpServer())
        .post('/produtores')
        .send({ documento: informado, nome: 'Maria da Silva' });

      expect(criacao.status).toBe(201);
      expect(criacao.body.documento).toBe(mascarado);

      const [linha] = await app
        .get(DataSource)
        .query(`SELECT * FROM produtores WHERE id = $1`, [criacao.body.id]);
      expect(JSON.stringify(linha)).not.toContain(semMascara);
      expect(linha.documento_impressao).toHaveLength(64);

      const leitura = await request(app.getHttpServer()).get(`/produtores/${criacao.body.id}`);
      expect(leitura.status).toBe(200);
      expect(leitura.body.documento).toBe(mascarado);
    },
  );

  it('a restrição de unicidade do banco recusa o Documento repetido', async () => {
    const documento = Documento.criar('390.533.447-05');
    const produtores = app.get<ProdutorRepository>(PRODUTOR_REPOSITORY);

    // Direto no repositório, sem passar pelo caso de uso: o que precisa ser exercitado é a
    // restrição do banco, que é a única coisa entre duas requisições simultâneas.
    await produtores.save(Produtor.criar({ documento, nome: 'Primeira' }));

    await expect(
      produtores.save(Produtor.criar({ documento, nome: 'Segunda' })),
    ).rejects.toThrow(ProdutorDuplicado);
  });

  it('a API responde o repetido em Problem Details, com o código do erro', async () => {
    const documento = '111.444.777-35';
    await request(app.getHttpServer()).post('/produtores').send({ documento, nome: 'Primeira' });

    const segunda = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento, nome: 'Segunda' });

    expect(segunda.status).toBe(409);
    expect(segunda.headers['content-type']).toContain('application/problem+json');
    expect(segunda.body.codigo).toBe('produtor-duplicado');
  });
});
