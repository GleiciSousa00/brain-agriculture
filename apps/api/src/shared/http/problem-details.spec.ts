import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PROBLEM_DETAILS_CONTENT_TYPE, toProblemDetails } from './problem-details';

const contexto = { instance: '/produtores', correlationId: 'abc-123' };

describe('toProblemDetails', () => {
  it('usa o tipo de conteúdo da RFC 9457', () => {
    expect(PROBLEM_DETAILS_CONTENT_TYPE).toBe('application/problem+json');
  });

  it('traduz uma exceção HTTP preservando status e título', () => {
    const problema = toProblemDetails({ error: new NotFoundException(), ...contexto });

    expect(problema).toMatchObject({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: '/produtores',
      correlationId: 'abc-123',
    });
  });

  it('leva a mensagem da exceção HTTP para o campo de detalhe', () => {
    const problema = toProblemDetails({
      error: new BadRequestException('Área agricultável maior que a área total'),
      ...contexto,
    });

    expect(problema.status).toBe(400);
    expect(problema.detail).toBe('Área agricultável maior que a área total');
  });

  it('junta as mensagens quando a exceção HTTP traz uma lista', () => {
    const problema = toProblemDetails({
      error: new BadRequestException({ message: ['nome é obrigatório', 'documento é obrigatório'] }),
      ...contexto,
    });

    expect(problema.detail).toBe('nome é obrigatório; documento é obrigatório');
  });

  it('trata erro desconhecido como falha interna', () => {
    const problema = toProblemDetails({ error: new Error('conexão recusada'), ...contexto });

    expect(problema).toMatchObject({ title: 'Internal Server Error', status: 500 });
  });

  it('não vaza a mensagem de um erro desconhecido no detalhe', () => {
    const problema = toProblemDetails({
      error: new Error('senha do banco: hunter2'),
      ...contexto,
    });

    expect(problema.detail).not.toContain('hunter2');
  });

  it('trata valor lançado que nem é erro', () => {
    const problema = toProblemDetails({ error: 'qualquer coisa', ...contexto });

    expect(problema.status).toBe(500);
  });

  it('sempre carrega o identificador de correlação da requisição', () => {
    const problema = toProblemDetails({ error: new Error('falha'), ...contexto });

    expect(problema.correlationId).toBe('abc-123');
  });
});
