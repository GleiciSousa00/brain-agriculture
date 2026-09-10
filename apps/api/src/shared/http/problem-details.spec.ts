import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PROBLEM_DETAILS_CONTENT_TYPE, toProblemDetails } from './problem-details';

const context = { instance: '/produtores', correlationId: 'abc-123' };

describe('toProblemDetails', () => {
  it('usa o tipo de conteúdo da RFC 9457', () => {
    expect(PROBLEM_DETAILS_CONTENT_TYPE).toBe('application/problem+json');
  });

  it('traduz uma exceção HTTP preservando status e título', () => {
    const problem = toProblemDetails({ error: new NotFoundException(), ...context });

    expect(problem).toMatchObject({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: '/produtores',
      correlationId: 'abc-123',
    });
  });

  it('leva a mensagem da exceção HTTP para o campo de detalhe', () => {
    const problem = toProblemDetails({
      error: new BadRequestException('Área agricultável maior que a área total'),
      ...context,
    });

    expect(problem.status).toBe(400);
    expect(problem.detail).toBe('Área agricultável maior que a área total');
  });

  it('junta as mensagens quando a exceção HTTP traz uma lista', () => {
    const problem = toProblemDetails({
      error: new BadRequestException({ message: ['nome é obrigatório', 'documento é obrigatório'] }),
      ...context,
    });

    expect(problem.detail).toBe('nome é obrigatório; documento é obrigatório');
  });

  it('trata erro desconhecido como falha interna', () => {
    const problem = toProblemDetails({ error: new Error('conexão recusada'), ...context });

    expect(problem).toMatchObject({ title: 'Internal Server Error', status: 500 });
  });

  it('não vaza a mensagem de um erro desconhecido no detalhe', () => {
    const problem = toProblemDetails({
      error: new Error('senha do banco: hunter2'),
      ...context,
    });

    expect(problem.detail).not.toContain('hunter2');
  });

  it('trata valor lançado que nem é erro', () => {
    const problem = toProblemDetails({ error: 'qualquer coisa', ...context });

    expect(problem.status).toBe(500);
  });

  it('sempre carrega o identificador de correlação da requisição', () => {
    const problem = toProblemDetails({ error: new Error('falha'), ...context });

    expect(problem.correlationId).toBe('abc-123');
  });
});
