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
    const gerado = resolveCorrelationId(undefined);

    expect(gerado).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gera um identificador quando o cabeçalho chega vazio', () => {
    expect(resolveCorrelationId('   ')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('recusa identificador longo demais e gera um no lugar', () => {
    const longo = 'a'.repeat(129);

    expect(resolveCorrelationId(longo)).not.toBe(longo);
  });

  it('recusa identificador com caractere fora do conjunto seguro', () => {
    const suspeito = 'abc\ninjetado';

    expect(resolveCorrelationId(suspeito)).not.toBe(suspeito);
  });

  it('gera identificador diferente a cada requisição sem cabeçalho', () => {
    expect(resolveCorrelationId(undefined)).not.toBe(resolveCorrelationId(undefined));
  });
});
