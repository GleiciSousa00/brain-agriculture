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
 * A issue 2 limita a suíte a cinco casos, e é por isso que dois deles são junções. O caso
 * do Plantio entrou juntando num só os dois que provavam o Documento repetido, pelo
 * repositório e pela API. O caso do painel entrou juntando os dois da cifra, que eram um
 * `it.each` sobre CPF e CNPJ: os dois documentos passaram a ser percorridos dentro de um
 * caso só, sem que nenhuma asserção se perdesse.
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
    const restricoes: { conname: string }[] = await dataSource.query(
      `SELECT conname FROM pg_constraint WHERE conrelid = 'plantios'::regclass ORDER BY conname`,
    );
    // As colunas que o painel agrupa recebem índice por migração, e o registro 0004 é o que
    // manda. A lista é a das duas tabelas que ele consulta, inteira, porque apagar um índice
    // não quebra nada visível e passaria pela pipeline verde.
    const indices: { indexname: string }[] = await dataSource.query(
      `SELECT indexname FROM pg_indexes WHERE tablename IN ('plantios', 'propriedades')
         AND indexname LIKE 'ix_%' ORDER BY indexname`,
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
    // O repositório de Plantio se apoia nestes nomes para dizer qual das três referências
    // falta. Renomear um deles na migração faria a tradução cair no caso geral, e a
    // resposta viraria 500 com a pipeline verde.
    expect(restricoes.map((restricao) => restricao.conname)).toEqual([
      'fk_plantios_cultura',
      'fk_plantios_propriedade',
      'fk_plantios_safra',
      'pk_plantios',
      'uq_plantios_ligacao',
    ]);
    expect(indices.map((indice) => indice.indexname)).toEqual([
      'ix_plantios_cultura',
      'ix_plantios_safra_cultura',
      'ix_propriedades_cidade',
      'ix_propriedades_estado',
      'ix_propriedades_produtor',
    ]);
    expect(catalogo.map((cultura) => cultura.nome)).toEqual(
      [...CULTURAS_INICIAIS].sort((um, outro) => (chaveDe(um) < chaveDe(outro) ? -1 : 1)),
    );
  });

  it('grava o CPF e o CNPJ cifrados e os lê de volta, sem nenhuma coluna em claro', async () => {
    // Os dois documentos são percorridos aqui dentro, e não num `it.each`, porque a suíte
    // tem cinco vagas e o caso do painel precisava de uma. Nenhuma asserção se perdeu.
    const documentos = [
      { informado: '529.982.247-25', semMascara: '52998224725', mascarado: '***.***.247-25' },
      {
        informado: '12.ABC.345/01DE-35',
        semMascara: '12ABC34501DE35',
        mascarado: '**.***.***/01DE-35',
      },
    ];

    for (const { informado, semMascara, mascarado } of documentos) {
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
    }
  });

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
    const [{ id: culturaId }] = (await request(app.getHttpServer()).get('/culturas').expect(200))
      .body;
    const { id: safraId } = (
      await request(app.getHttpServer()).post('/safras').send({ ano: 2031 }).expect(201)
    ).body;

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

  it('o painel agrega no banco e confere com os números conhecidos', async () => {
    // A base é esvaziada primeiro porque as agregações são do cadastro inteiro, e os casos
    // acima deixaram Propriedades e Plantios para trás. A cascata leva os Plantios junto.
    await app.get(DataSource).query(`TRUNCATE TABLE propriedades CASCADE`);

    const vazio = await request(app.getHttpServer()).get('/painel').expect(200);
    expect(vazio.body).toEqual({
      totais: { propriedades: 0, areaTotal: 0 },
      usoDoSolo: { areaAgricultavel: 0, areaDeVegetacao: 0 },
      propriedadesPorEstado: [],
      plantiosPorCultura: [],
    });

    const { soja, milho, safraId, outraSafraId } = await cadastroDoPainel();

    const inteiro = await request(app.getHttpServer()).get('/painel').expect(200);
    const recortado = await request(app.getHttpServer())
      .get('/painel')
      .query({ safraId })
      .expect(200);

    // Três Propriedades: 100 + 50 + 25,5 hectares, com 60 + 30 + 15,5 agricultáveis.
    expect(inteiro.body.totais).toEqual({ propriedades: 3, areaTotal: 175.5 });
    expect(inteiro.body.usoDoSolo).toEqual({ areaAgricultavel: 105.5, areaDeVegetacao: 70 });
    expect(inteiro.body.propriedadesPorEstado).toEqual([
      { estado: 'MT', propriedades: 2 },
      { estado: 'SP', propriedades: 1 },
    ]);
    expect(inteiro.body.plantiosPorCultura).toEqual([
      { culturaId: soja.id, cultura: soja.nome, plantios: 3 },
      { culturaId: milho.id, cultura: milho.nome, plantios: 2 },
    ]);

    // O filtro recorta a distribuição por Cultura e não toca no resto.
    expect(recortado.body.plantiosPorCultura).toEqual([
      { culturaId: soja.id, cultura: soja.nome, plantios: 3 },
      { culturaId: milho.id, cultura: milho.nome, plantios: 1 },
    ]);
    expect(recortado.body.totais).toEqual(inteiro.body.totais);
    expect(recortado.body.usoDoSolo).toEqual(inteiro.body.usoDoSolo);
    expect(recortado.body.propriedadesPorEstado).toEqual(inteiro.body.propriedadesPorEstado);

    const semPlantio = await request(app.getHttpServer())
      .get('/painel')
      .query({ safraId: outraSafraId })
      .expect(200);
    expect(semPlantio.body.plantiosPorCultura).toEqual([
      { culturaId: milho.id, cultura: milho.nome, plantios: 1 },
    ]);
  });

  /**
   * O cadastro conferido à mão de que o caso do painel se cobra: três Propriedades em dois
   * estados, duas Culturas do catálogo e cinco Plantios em duas Safras.
   */
  async function cadastroDoPainel() {
    const produtor = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: '295.379.955-93', nome: 'Quem aparece no painel' })
      .expect(201);
    const emMatoGrosso = await propriedadeDoPainel(produtor.body.id, 'MT', 100, 60, 40);
    const outraEmMatoGrosso = await propriedadeDoPainel(produtor.body.id, 'MT', 50, 30, 20);
    const emSaoPaulo = await propriedadeDoPainel(produtor.body.id, 'SP', 25.5, 15.5, 10);

    const catalogo: { id: string; nome: string }[] = (
      await request(app.getHttpServer()).get('/culturas').expect(200)
    ).body;
    const [soja, milho] = catalogo;

    if (soja === undefined || milho === undefined) {
      throw new Error('A carga inicial do catálogo precisa ter pelo menos duas Culturas.');
    }

    const { id: safraId } = (
      await request(app.getHttpServer()).post('/safras').send({ ano: 2041 }).expect(201)
    ).body;
    const { id: outraSafraId } = (
      await request(app.getHttpServer()).post('/safras').send({ ano: 2042 }).expect(201)
    ).body;

    await plantioDoPainel(emMatoGrosso, soja.id, safraId);
    await plantioDoPainel(outraEmMatoGrosso, soja.id, safraId);
    await plantioDoPainel(emSaoPaulo, soja.id, safraId);
    await plantioDoPainel(emMatoGrosso, milho.id, safraId);
    await plantioDoPainel(outraEmMatoGrosso, milho.id, outraSafraId);

    return { soja, milho, safraId, outraSafraId };
  }

  async function propriedadeDoPainel(
    produtorId: string,
    estado: string,
    areaTotal: number,
    areaAgricultavel: number,
    areaDeVegetacao: number,
  ): Promise<string> {
    const criada = await request(app.getHttpServer())
      .post('/propriedades')
      .send({ produtorId, cidade: 'Sorriso', estado, areaTotal, areaAgricultavel, areaDeVegetacao })
      .expect(201);

    return criada.body.id;
  }

  async function plantioDoPainel(
    propriedadeId: string,
    culturaId: string,
    safraId: string,
  ): Promise<void> {
    await request(app.getHttpServer())
      .post('/plantios')
      .send({ propriedadeId, culturaId, safraId })
      .expect(201);
  }

  /**
   * Um Produtor com uma Propriedade, que é o mínimo para um Plantio poder existir.
   *
   * Cada passo confere o próprio status. Sem isso um preparo que falha chega ao caso como
   * identificador indefinido, e o teste acusa o Plantio por um erro que não é dele.
   */
  async function propriedadeDeTeste(): Promise<string> {
    const produtor = await request(app.getHttpServer())
      .post('/produtores')
      .send({ documento: '693.318.670-93', nome: 'Quem planta' })
      .expect(201);

    const propriedade = await request(app.getHttpServer())
      .post('/propriedades')
      .send({
        produtorId: produtor.body.id,
        cidade: 'Sorriso',
        estado: 'MT',
        areaTotal: 100,
        areaAgricultavel: 60,
        areaDeVegetacao: 40,
      })
      .expect(201);

    return propriedade.body.id;
  }
});
