import { randomBytes, randomUUID } from 'node:crypto';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

const CPF = '529.982.247-25';
const CPF_SEM_MASCARA = '52998224725';
const CNPJ_ALFANUMERICO = '12.ABC.345/01DE-35';

describe('Produtores, ponta a ponta', () => {
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

  it('a migração criou o esquema, e a sincronização automática está desligada', async () => {
    const dataSource = app.get(DataSource);

    const colunas: { column_name: string }[] = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'produtores'`,
    );

    expect(dataSource.options.synchronize).toBe(false);
    expect(colunas.map((coluna) => coluna.column_name).sort()).toEqual([
      'criado_em',
      'documento_cifrado',
      'documento_impressao',
      'id',
      'nome',
    ]);
  });

  it('registra um Produtor com CPF e devolve o Documento mascarado', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: CPF, nome: 'Maria da Silva' });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      nome: 'Maria da Silva',
      documento: '***.***.247-25',
      tipoDeDocumento: 'CPF',
    });
    expect(JSON.stringify(resposta.body)).not.toContain(CPF_SEM_MASCARA);
  });

  it('registra um Produtor com CNPJ alfanumérico', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: CNPJ_ALFANUMERICO, nome: 'Fazenda ABC' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.tipoDeDocumento).toBe('CNPJ');
    expect(resposta.body.documento).toBe('**.***.***/01DE-35');
  });

  it('o banco guarda o Documento cifrado e a impressão, e nenhuma coluna em claro', async () => {
    const documento = '00.000.000/0001-91';
    const criacao = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento, nome: 'Fazenda Numérica' });

    const [linha] = await app
      .get(DataSource)
      .query(`SELECT * FROM produtores WHERE id = $1`, [criacao.body.id]);

    expect(JSON.stringify(linha)).not.toContain('00000000000191');
    expect(linha.documento_cifrado).toEqual(expect.any(String));
    expect(linha.documento_impressao).toHaveLength(64);
  });

  it('a cifra vai e volta: o Produtor lido tem o mesmo Documento que entrou', async () => {
    const criacao = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: '111.444.777-35', nome: 'Ida e Volta' });

    const leitura = await request(app.getHttpServer()).get(`/produtores/${criacao.body.id}`);

    expect(leitura.status).toBe(200);
    expect(leitura.body.documento).toBe('***.***.777-35');
  });

  it('recusa o segundo Produtor com o mesmo Documento, e a restrição do banco confirma', async () => {
    const documento = '390.533.447-05';
    await request(app.getHttpServer()).post('/produtores').send({ documento, nome: 'Primeira' });

    const segunda = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento, nome: 'Segunda' });

    expect(segunda.status).toBe(409);
    expect(segunda.body.codigo).toBe('produtor-duplicado');

    // A conferência do caso de uso é a mensagem amigável. A restrição do banco é a
    // garantia: sem ela, duas requisições simultâneas passariam as duas.
    const restricoes: { conname: string }[] = await app
      .get(DataSource)
      .query(`SELECT conname FROM pg_constraint WHERE conname = 'uq_produtores_documento'`);
    expect(restricoes).toHaveLength(1);
  });

  it.each([
    ['dígito verificador errado', '529.982.247-26'],
    ['letra minúscula no CNPJ', '12.ABc.345/01DE-35'],
    ['CNPJ zerado', '00.000.000/0000-00'],
    ['CPF com sequência repetida', '111.111.111-11'],
  ])('recusa %s em Problem Details', async (_caso, documento) => {
    const resposta = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento, nome: 'Recusada' });

    expect(resposta.status).toBe(400);
    expect(resposta.headers['content-type']).toContain('application/problem+json');
    expect(resposta.body).toMatchObject({ codigo: 'documento-invalido', status: 400 });
    expect(resposta.body.detail).toEqual(expect.any(String));
  });

  it('aceita CNPJ com caracteres repetidos, que a Receita considera válido', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: '11.111.111/1111-80', nome: 'Repetida' });

    expect(resposta.status).toBe(201);
  });

  it('devolve não encontrado para identificador que não existe', async () => {
    const resposta = await request(app.getHttpServer()).get(`/produtores/${randomUUID()}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body.codigo).toBe('produtor-nao-encontrado');
  });

  it('nenhuma resposta de erro carrega o Documento informado', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: '529.982.247-26', nome: 'Recusada' });

    expect(JSON.stringify(resposta.body)).not.toContain('529982247');
  });
});
