import { randomBytes, randomUUID } from 'node:crypto';
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
 * as migrações criaram o esquema, que a cifra vai e volta, que a unicidade recusa o
 * repetido, e que a exclusão em cascata chega até o Plantio. Regra de negócio é assunto dos
 * testes de unidade, que rodam sem Docker e em milissegundos.
 *
 * A issue 2 limita a suíte a cinco casos. O caso do Plantio entrou juntando num só os dois
 * que provavam o Documento repetido, pelo repositório e pela API.
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
    const plantios: { column_name: string }[] = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'plantios'`,
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
    expect(plantios.map((coluna) => coluna.column_name).sort()).toEqual([
      'criado_em',
      'cultura_id',
      'id',
      'propriedade_id',
      'safra_id',
    ]);
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

  it('a unicidade recusa o Documento repetido, no repositório e na resposta da API', async () => {
    const documento = Documento.criar('390.533.447-05');
    const produtores = app.get<ProdutorRepository>(PRODUTOR_REPOSITORY);

    // Direto no repositório, sem passar pelo caso de uso: o que precisa ser exercitado é a
    // restrição do banco, que é a única coisa entre duas requisições simultâneas.
    await produtores.save(Produtor.criar({ documento, nome: 'Primeira' }));

    await expect(produtores.save(Produtor.criar({ documento, nome: 'Segunda' }))).rejects.toThrow(
      ProdutorDuplicado,
    );

    const repetido = '111.444.777-35';
    await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: repetido, nome: 'Primeira' });
    const segunda = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: repetido, nome: 'Segunda' });

    expect(segunda.status).toBe(409);
    expect(segunda.headers['content-type']).toContain('application/problem+json');
    expect(segunda.body.codigo).toBe('produtor-duplicado');
  });

  it('o Plantio recusa a ligação repetida e some junto com a Propriedade', async () => {
    const propriedadeId = await propriedadeDeTeste();
    const [{ id: culturaId }] = (await request(app.getHttpServer()).get('/culturas')).body;
    const { id: safraId } = (await request(app.getHttpServer()).post('/safras').send({ ano: 2031 }))
      .body;

    const primeiro = await request(app.getHttpServer())
      .post('/plantios')
      .send({ propriedadeId, culturaId, safraId });
    const repetido = await request(app.getHttpServer())
      .post('/plantios')
      .send({ propriedadeId, culturaId, safraId });
    const semSafra = await request(app.getHttpServer())
      .post('/plantios')
      .send({ propriedadeId, culturaId, safraId: randomUUID() });

    expect(primeiro.status).toBe(201);
    expect(repetido.status).toBe(409);
    expect(repetido.body.codigo).toBe('plantio-duplicado');
    expect(semSafra.status).toBe(404);
    expect(semSafra.body.codigo).toBe('safra-do-plantio-nao-encontrada');

    // A cascata é da chave estrangeira, e é o único jeito de prová-la.
    await request(app.getHttpServer()).delete(`/propriedades/${propriedadeId}`).expect(204);

    const sobraram = await app
      .get(DataSource)
      .query(`SELECT id FROM plantios WHERE id = $1`, [primeiro.body.id]);
    expect(sobraram).toEqual([]);
  });

  /** Um Produtor com uma Propriedade, que é o mínimo para um Plantio poder existir. */
  async function propriedadeDeTeste(): Promise<string> {
    const produtor = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: '693.318.670-93', nome: 'Quem planta' });

    const propriedade = await request(app.getHttpServer()).post('/propriedades').send({
      produtorId: produtor.body.id,
      cidade: 'Sorriso',
      estado: 'MT',
      areaTotal: 100,
      areaAgricultavel: 60,
      areaDeVegetacao: 40,
    });

    return propriedade.body.id;
  }
});
