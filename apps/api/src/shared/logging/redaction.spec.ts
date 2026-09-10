import { Writable } from 'node:stream';
import pino from 'pino';
import { DOCUMENTO_REDACTION_PATHS, REDACTION_CENSOR } from './redaction';

/** Coleta as linhas escritas pelo logger para que o teste leia o JSON que sairia. */
function testLogger(): { logger: pino.Logger; lines: () => string } {
  let output = '';
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      output += String(chunk);
      callback();
    },
  });

  const logger = pino(
    { redact: { paths: DOCUMENTO_REDACTION_PATHS, censor: REDACTION_CENSOR } },
    destination,
  );

  return { logger, lines: () => output };
}

const DOCUMENTO = '12.ABC.345/01DE-35';

describe('regra de redação do Documento', () => {
  it.each([
    ['corpo da requisição', { req: { body: { documento: DOCUMENTO } } }],
    ['parâmetros de consulta', { req: { query: { documento: DOCUMENTO } } }],
    ['corpo da resposta', { res: { body: { documento: DOCUMENTO } } }],
    ['objeto solto no log', { documento: DOCUMENTO }],
    ['objeto aninhado um nível', { produtor: { documento: DOCUMENTO } }],
  ])('apaga o Documento vindo em %s', (_caso, payload) => {
    const { logger, lines } = testLogger();

    logger.info(payload, 'produtor registrado');

    expect(lines()).not.toContain(DOCUMENTO);
    expect(lines()).toContain(REDACTION_CENSOR);
  });

  it('não apaga campo que não é o Documento', () => {
    const { logger, lines } = testLogger();

    logger.info({ produtor: { nome: 'Maria' } }, 'produtor registrado');

    expect(lines()).toContain('Maria');
  });
});
