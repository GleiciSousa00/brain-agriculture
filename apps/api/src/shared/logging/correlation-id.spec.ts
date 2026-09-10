import { CORRELATION_ID_HEADER, resolveCorrelationId } from './correlation-id';

describe('resolveCorrelationId', () => {
  it('nomeia o cabeçalho que carrega o identificador', () => {
    expect(CORRELATION_ID_HEADER).toBe('x-correlation-id');
  });

  it('reaproveita o identificador que chegou na requisição', () => {
    expect(resolveCorrelationId('abc-123')).toBe('abc-123');
  });

  it('descarta espaço em volta do identificador recebido', () => {
    expect(resolveCorrelationId('  abc-123  ')).toBe('abc-123');
  });

  it('usa o primeiro valor quando o cabeçalho vem repetido', () => {
    expect(resolveCorrelationId(['primeiro', 'segundo'])).toBe('primeiro');
  });

  it('gera um identificador quando a requisição não traz nenhum', () => {
    const generated = resolveCorrelationId(undefined);

    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gera um identificador quando o cabeçalho chega vazio', () => {
    expect(resolveCorrelationId('   ')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('recusa identificador longo demais e gera um no lugar', () => {
    const tooLong = 'a'.repeat(129);

    expect(resolveCorrelationId(tooLong)).not.toBe(tooLong);
  });

  it('recusa identificador com caractere fora do conjunto seguro', () => {
    const unsafe = 'abc\ninjetado';

    expect(resolveCorrelationId(unsafe)).not.toBe(unsafe);
  });

  it('gera identificador diferente a cada requisição sem cabeçalho', () => {
    expect(resolveCorrelationId(undefined)).not.toBe(resolveCorrelationId(undefined));
  });
});
