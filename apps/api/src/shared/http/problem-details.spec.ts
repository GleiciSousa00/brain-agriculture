import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DomainError, type NaturezaDaFalha } from '../domain/domain-error';
import { PROBLEM_DETAILS_CONTENT_TYPE, toProblemDetails } from './problem-details';

class FalhaDeTeste extends DomainError {
  constructor(
    readonly codigo: string,
    readonly natureza: NaturezaDaFalha,
    mensagem = 'a regra não fecha',
  ) {
    super(mensagem);
  }
}

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

describe('toProblemDetails com erro de domínio', () => {
  it.each([
    ['entrada-invalida', 400],
    ['conflito', 409],
    ['nao-encontrado', 404],
  ] as const)('traduz a natureza %s para o status %i', (natureza, status) => {
    const problem = toProblemDetails({
      error: new FalhaDeTeste('qualquer-coisa', natureza),
      ...context,
    });

    expect(problem.status).toBe(status);
  });

  it('leva a mensagem do domínio para o detalhe, porque ela é para quem chamou', () => {
    const problem = toProblemDetails({
      error: new FalhaDeTeste('documento-invalido', 'entrada-invalida', 'O dígito não confere.'),
      ...context,
    });

    expect(problem.detail).toBe('O dígito não confere.');
  });

  it('publica o código do erro, para o tratamento não depender do texto', () => {
    const problem = toProblemDetails({
      error: new FalhaDeTeste('produtor-duplicado', 'conflito'),
      ...context,
    });

    expect(problem.codigo).toBe('produtor-duplicado');
  });

  it('não publica código quando a falha não vem do domínio', () => {
    const problem = toProblemDetails({ error: new NotFoundException(), ...context });

    expect(problem.codigo).toBeUndefined();
  });
});
