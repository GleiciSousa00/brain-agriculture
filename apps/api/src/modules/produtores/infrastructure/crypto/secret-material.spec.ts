import { randomBytes } from 'node:crypto';
import { MATERIAL_DE_DESENVOLVIMENTO, readSecretMaterial } from './secret-material';

const PROPRIO = randomBytes(32).toString('base64');

describe('readSecretMaterial', () => {
  it('devolve os trinta e dois bytes da variável', () => {
    expect(readSecretMaterial(PROPRIO, 'CHAVE', 'development')).toHaveLength(32);
  });

  it.each([
    ['não definida', undefined],
    ['vazia', ''],
  ])('recusa variável %s', (_caso, valor) => {
    expect(() => readSecretMaterial(valor, 'CHAVE', 'development')).toThrow(/CHAVE/);
  });

  it('recusa material com tamanho errado', () => {
    expect(() => readSecretMaterial(randomBytes(16).toString('base64'), 'CHAVE', 'development')).toThrow(
      /trinta e dois/i,
    );
  });

  it.each(MATERIAL_DE_DESENVOLVIMENTO)('recusa em produção o valor público %s', (publico) => {
    expect(() => readSecretMaterial(publico, 'CHAVE', 'production')).toThrow(/produção/i);
  });

  it('aceita o valor de desenvolvimento fora de produção, que é o que faz a composição subir', () => {
    expect(() => readSecretMaterial(MATERIAL_DE_DESENVOLVIMENTO[0], 'CHAVE', 'development')).not.toThrow();
  });
});
