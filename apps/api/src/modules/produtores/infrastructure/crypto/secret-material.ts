const TAMANHO_ESPERADO = 32;

/**
 * Os valores que a composição usa para que um clone recém-feito suba com um comando.
 *
 * Eles estão publicados em `docker-compose.yml` e portanto não são segredo de ninguém. A
 * lista existe para que a aplicação recuse arrancar com eles em produção, que é o único
 * jeito de a exigência do registro 0002 ser mais que um comentário.
 */
export const MATERIAL_DE_DESENVOLVIMENTO = [
  'MFxpNBlirscUhol6+3M10FDOP08FwX/wz8GMUNc8Qmw=',
  '8wJpFBv+Fzfy5s07/oRT5i0/V3kzRif/IT8Uyw9Gh+w=',
];

/** Lê a chave ou o segredo do ambiente, recusando o que não serve. */
export function readSecretMaterial(valor: string | undefined, variavel: string, ambiente: string | undefined): Buffer {
  if (valor === undefined || valor.length === 0) {
    throw new Error(`A variável de ambiente ${variavel} não está definida.`);
  }

  if (ambiente === 'production' && MATERIAL_DE_DESENVOLVIMENTO.includes(valor)) {
    throw new Error(
      `A variável ${variavel} está com o valor de desenvolvimento, que é público. Gere um próprio antes de subir em produção.`,
    );
  }

  const material = Buffer.from(valor, 'base64');

  if (material.length !== TAMANHO_ESPERADO) {
    throw new Error(`A variável ${variavel} precisa ter trinta e dois bytes em base64.`);
  }

  return material;
}
