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
@Controller('scaffold')
class ScaffoldController {
  @Get('nao-encontrado')
  notFound(): never {
    throw new NotFoundException('Produtor não encontrado');
  }

  @Get('explode')
  blowUp(): never {
    throw new Error('segredo que não pode sair na resposta');
  }
}

describe('borda HTTP', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [LoggingModule],
      controllers: [ScaffoldController],
      providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
    }).compile();

    app = testingModule.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve Problem Details quando a exceção é de HTTP', async () => {
    const response = await request(app.getHttpServer()).get('/scaffold/nao-encontrado');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain(PROBLEM_DETAILS_CONTENT_TYPE);
    expect(response.body).toMatchObject({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Produtor não encontrado',
      instance: '/scaffold/nao-encontrado',
    });
  });

  it('devolve Problem Details, sem vazar a mensagem, quando o erro não foi previsto', async () => {
    const response = await request(app.getHttpServer()).get('/scaffold/explode');

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('segredo');
  });

  it('reaproveita o identificador de correlação que chegou na requisição', async () => {
    const response = await request(app.getHttpServer())
      .get('/scaffold/nao-encontrado')
      .set(CORRELATION_ID_HEADER, 'correlacao-de-fora');

    expect(response.headers[CORRELATION_ID_HEADER]).toBe('correlacao-de-fora');
    expect(response.body.correlationId).toBe('correlacao-de-fora');
  });

  it('gera identificador de correlação quando a requisição não traz nenhum', async () => {
    const response = await request(app.getHttpServer()).get('/scaffold/nao-encontrado');

    expect(response.headers[CORRELATION_ID_HEADER]).toEqual(expect.any(String));
    expect(response.body.correlationId).toBe(response.headers[CORRELATION_ID_HEADER]);
  });
});
