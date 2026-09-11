import {
  Body,
  Controller,
  Delete,
  Get,
  INestApplication,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE, DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe, createZodDto } from 'nestjs-zod';
import request from 'supertest';
import { z } from 'zod';
import { CORRELATION_ID_HEADER } from '../src/shared/logging/correlation-id';
import { PROBLEM_DETAILS_CONTENT_TYPE } from '../src/shared/http/problem-details';
import { IdentificadorPipe } from '../src/shared/http/identificador.pipe';
import { ProblemDetailsFilter } from '../src/shared/http/problem-details.filter';
import { RotasDaApi } from '../src/shared/http/rotas-da-api';
import { TipoDeConteudoGuard } from '../src/shared/http/tipo-de-conteudo.guard';
import { LoggingModule } from '../src/shared/logging/logging.module';

class CadastrarDto extends createZodDto(
  z.object({ nome: z.string().min(1), area: z.number().positive() }),
) {}

/** Rotas de mentira, só para exercitar a borda HTTP sem depender do cadastro. */
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

  @Post('cadastro')
  cadastrar(@Body() corpo: CadastrarDto): CadastrarDto {
    return corpo;
  }

  @Delete('cadastro/:id')
  excluir(): void {}

  @Get('registro/:id')
  porIdentificador(@Param('id', IdentificadorPipe) id: string): { id: string } {
    return { id };
  }
}

describe('borda HTTP', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [LoggingModule, DiscoveryModule],
      controllers: [ScaffoldController],
      providers: [
        RotasDaApi,
        { provide: APP_FILTER, useClass: ProblemDetailsFilter },
        { provide: APP_GUARD, useClass: TipoDeConteudoGuard },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
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

  it('recusa com 413 o corpo que passa do tamanho aceito, e não com 500', async () => {
    const response = await request(app.getHttpServer())
      .post('/scaffold/cadastro')
      .send({ nome: 'x'.repeat(200_000), area: 1 });

    expect(response.status).toBe(413);
    expect(response.body.title).toBe('Payload Too Large');
  });

  it('recusa com 415 o corpo que não é JSON', async () => {
    const response = await request(app.getHttpServer())
      .post('/scaffold/cadastro')
      .set('content-type', 'application/xml')
      .send('<cadastro/>');

    expect(response.status).toBe(415);
    expect(response.body.detail).toContain('application/json');
  });

  it('aceita JSON declarado com codificação junto', async () => {
    const response = await request(app.getHttpServer())
      .post('/scaffold/cadastro')
      .set('content-type', 'application/json; charset=utf-8')
      .send({ nome: 'Ana', area: 10 });

    expect(response.status).toBe(201);
  });

  it('diz qual campo o esquema recusou, e não só que a validação falhou', async () => {
    const response = await request(app.getHttpServer())
      .post('/scaffold/cadastro')
      .send({ area: -1 });

    expect(response.status).toBe(400);
    expect(response.body.erros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ campo: 'nome' }),
        expect.objectContaining({ campo: 'area' }),
      ]),
    );
  });

  it('recusa em português o identificador que não é UUID, sem repassar o texto do Nest', async () => {
    const response = await request(app.getHttpServer()).get('/scaffold/registro/nao-e-uuid');

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('O identificador informado não é um UUID.');
  });

  it('responde 405 com o cabeçalho Allow quando o caminho existe e o método não', async () => {
    const response = await request(app.getHttpServer()).put('/scaffold/cadastro/abc');

    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('DELETE');
  });

  it('mantém o 404 quando o caminho não existe em método nenhum', async () => {
    const response = await request(app.getHttpServer()).get('/scaffold/nao-existe-em-lugar-nenhum');

    expect(response.status).toBe(404);
  });
});
