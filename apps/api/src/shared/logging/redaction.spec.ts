import { Writable } from 'node:stream';
import pino from 'pino';
import { DOCUMENTO_REDACTION_PATHS, REDACTION_CENSOR } from './redaction';

/** Coleta as linhas escritas pelo logger para que o teste leia o JSON que sairia. */
function loggerDeTeste(): { logger: pino.Logger; linhas: () => string } {
  let saida = '';
  const destino = new Writable({
    write(pedaco, _codificacao, callback) {
      saida += String(pedaco);
      callback();
    },
  });

  const logger = pino(
    { redact: { paths: DOCUMENTO_REDACTION_PATHS, censor: REDACTION_CENSOR } },
    destino,
  );

  return { logger, linhas: () => saida };
}

const DOCUMENTO = '12.ABC.345/01DE-35';

describe('regra de redação do Documento', () => {
  it.each([
    ['corpo da requisição', { req: { body: { documento: DOCUMENTO } } }],
    ['parâmetros de consulta', { req: { query: { documento: DOCUMENTO } } }],
    ['corpo da resposta', { res: { body: { documento: DOCUMENTO } } }],
    ['objeto solto no log', { documento: DOCUMENTO }],
    ['objeto aninhado um nível', { produtor: { documento: DOCUMENTO } }],
  ])('apaga o Documento vindo em %s', (_caso, carga) => {
    const { logger, linhas } = loggerDeTeste();

    logger.info(carga, 'produtor registrado');

    expect(linhas()).not.toContain(DOCUMENTO);
    expect(linhas()).toContain(REDACTION_CENSOR);
  });

  it('não apaga campo que não é o Documento', () => {
    const { logger, linhas } = loggerDeTeste();

    logger.info({ produtor: { nome: 'Maria' } }, 'produtor registrado');

    expect(linhas()).toContain('Maria');
  });
});
