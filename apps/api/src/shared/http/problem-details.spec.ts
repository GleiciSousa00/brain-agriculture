import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
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

describe('toProblemDetails com recusa vinda de fora da aplicação', () => {
  it('respeita o status do erro que não é exceção do Nest, como o do corpo grande demais', () => {
    const grandeDemais = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
      status: 413,
    });

    const problem = toProblemDetails({ error: grandeDemais, ...context });

    expect(problem.status).toBe(413);
    expect(problem.title).toBe('Payload Too Large');
  });

  it('não repete a mensagem em inglês da biblioteca no detalhe', () => {
    const grandeDemais = Object.assign(new Error('request entity too large'), { status: 413 });

    const problem = toProblemDetails({ error: grandeDemais, ...context });

    expect(problem.detail).not.toContain('request entity too large');
  });

  it('ignora status fora da faixa de erro, que não diria nada sobre a falha', () => {
    const problem = toProblemDetails({
      error: Object.assign(new Error('falhou'), { status: 200 }),
      ...context,
    });

    expect(problem.status).toBe(500);
  });
});

describe('toProblemDetails com recusa de esquema', () => {
  const recusaDe = (issues: unknown[]) =>
    toProblemDetails({ error: new ZodValidationException({ issues }), ...context });

  it('diz qual campo foi recusado, e não só que a validação falhou', () => {
    const problem = recusaDe([{ path: ['nome'], message: 'Required' }]);

    expect(problem.erros).toEqual([{ campo: 'nome', mensagem: 'Required' }]);
    expect(problem.detail).toBe('nome: Required');
  });

  it('publica um por um os campos recusados', () => {
    const problem = recusaDe([
      { path: ['nome'], message: 'Required' },
      { path: ['areaTotal'], message: 'Deve ser maior que zero' },
    ]);

    expect(problem.erros).toHaveLength(2);
    expect(problem.detail).toBe('nome: Required; areaTotal: Deve ser maior que zero');
  });

  it('junta o caminho de um campo aninhado', () => {
    const problem = recusaDe([{ path: ['endereco', 'estado'], message: 'Duas letras' }]);

    expect(problem.erros).toEqual([{ campo: 'endereco.estado', mensagem: 'Duas letras' }]);
  });

  it('chama de corpo o que foi recusado sem campo nenhum apontado', () => {
    const problem = recusaDe([{ path: [], message: 'Objeto esperado' }]);

    expect(problem.erros).toEqual([{ campo: 'corpo', mensagem: 'Objeto esperado' }]);
  });

  it('recai na mensagem da exceção quando a recusa não trouxe problema nenhum', () => {
    const problem = toProblemDetails({ error: new ZodValidationException({}), ...context });

    expect(problem.status).toBe(400);
    expect(problem.detail).toBe('Validation failed');
    expect(problem.erros).toBeUndefined();
  });
});
