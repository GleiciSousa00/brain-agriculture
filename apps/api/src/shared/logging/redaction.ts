/** Marca que substitui o valor apagado na linha de log. */
export const REDACTION_CENSOR = '[REDIGIDO]';

/**
 * Caminhos em que o Documento pode aparecer numa linha de log.
 *
 * A regra existe antes do campo: o Documento é dado pessoal e nunca pode vazar por log,
 * então a redação é configurada agora e vale para o cadastro quando ele chegar.
 */
export const DOCUMENTO_REDACTION_PATHS: string[] = [
  'documento',
  '*.documento',
  'req.body.documento',
  'req.query.documento',
  'req.params.documento',
  'req.headers.documento',
  'res.body.documento',
  'req.body.*.documento',
  'res.body.*.documento',
];
