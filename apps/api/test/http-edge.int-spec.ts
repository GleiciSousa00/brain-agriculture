import { Controller, Get, INestApplication, NotFoundException } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { CORRELATION_ID_HEADER } from '../src/shared/logging/correlation-id';
import { PROBLEM_DETAILS_CONTENT_TYPE } from '../src/shared/http/problem-details';
import { ProblemDetailsFilter } from '../src/shared/http/problem-details.filter';
import { LoggingModule } from '../src/shared/logging/logging.module';

/** Duas rotas de mentira, só para exercitar a borda HTTP sem depender do cadastro. */
@Controller('andaime')
class AndaimeController {
  @Get('nao-existe')
  naoExiste(): never {
    throw new NotFoundException('Produtor não encontrado');
  }

  @Get('explode')
  explode(): never {
    throw new Error('segredo que não pode sair na resposta');
  }
}

describe('borda HTTP', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [LoggingModule],
      controllers: [AndaimeController],
      providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
    }).compile();

    app = modulo.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve Problem Details quando a exceção é de HTTP', async () => {
    const resposta = await request(app.getHttpServer()).get('/andaime/nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.headers['content-type']).toContain(PROBLEM_DETAILS_CONTENT_TYPE);
    expect(resposta.body).toMatchObject({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Produtor não encontrado',
      instance: '/andaime/nao-existe',
    });
  });

  it('devolve Problem Details, sem vazar a mensagem, quando o erro não foi previsto', async () => {
    const resposta = await request(app.getHttpServer()).get('/andaime/explode');

    expect(resposta.status).toBe(500);
    expect(JSON.stringify(resposta.body)).not.toContain('segredo');
  });

  it('reaproveita o identificador de correlação que chegou na requisição', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/andaime/nao-existe')
      .set(CORRELATION_ID_HEADER, 'correlacao-de-fora');

    expect(resposta.headers[CORRELATION_ID_HEADER]).toBe('correlacao-de-fora');
    expect(resposta.body.correlationId).toBe('correlacao-de-fora');
  });

  it('gera identificador de correlação quando a requisição não traz nenhum', async () => {
    const resposta = await request(app.getHttpServer()).get('/andaime/nao-existe');

    expect(resposta.headers[CORRELATION_ID_HEADER]).toEqual(expect.any(String));
    expect(resposta.body.correlationId).toBe(resposta.headers[CORRELATION_ID_HEADER]);
  });
});
