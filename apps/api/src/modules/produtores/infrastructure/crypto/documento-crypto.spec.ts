import { randomBytes } from 'node:crypto';
import { DocumentoCrypto } from './documento-crypto';

const DOCUMENTO = '52998224725';

function crypto(): DocumentoCrypto {
  return new DocumentoCrypto({
    chaveDeCifra: randomBytes(32),
    segredoDaImpressao: randomBytes(32),
  });
}

describe('DocumentoCrypto', () => {
  it('decifra de volta o valor cifrado', () => {
    const documentoCrypto = crypto();

    const cifrado = documentoCrypto.cifrar(DOCUMENTO);

    expect(documentoCrypto.decifrar(cifrado)).toBe(DOCUMENTO);
  });

  it('não guarda o valor em claro dentro do pacote cifrado', () => {
    expect(crypto().cifrar(DOCUMENTO)).not.toContain(DOCUMENTO);
  });

  it('cifra o mesmo valor em bytes diferentes a cada vez, por causa do nonce', () => {
    const documentoCrypto = crypto();

    expect(documentoCrypto.cifrar(DOCUMENTO)).not.toBe(documentoCrypto.cifrar(DOCUMENTO));
  });

  it('recusa pacote adulterado, porque o GCM autentica', () => {
    const documentoCrypto = crypto();
    const cifrado = documentoCrypto.cifrar(DOCUMENTO);
    const adulterado = `${cifrado.slice(0, -4)}AAAA`;

    expect(() => documentoCrypto.decifrar(adulterado)).toThrow();
  });

  it('devolve sempre a mesma impressão para o mesmo valor, que é o que a unicidade exige', () => {
    const documentoCrypto = crypto();

    expect(documentoCrypto.impressao(DOCUMENTO)).toBe(documentoCrypto.impressao(DOCUMENTO));
  });

  it('devolve impressões diferentes para valores diferentes', () => {
    const documentoCrypto = crypto();

    expect(documentoCrypto.impressao(DOCUMENTO)).not.toBe(
      documentoCrypto.impressao('11144477735'),
    );
  });

  it('devolve impressões diferentes quando o segredo muda', () => {
    const chave = randomBytes(32);

    const comUmSegredo = new DocumentoCrypto({
      chaveDeCifra: chave,
      segredoDaImpressao: randomBytes(32),
    }).impressao(DOCUMENTO);
    const comOutro = new DocumentoCrypto({
      chaveDeCifra: chave,
      segredoDaImpressao: randomBytes(32),
    }).impressao(DOCUMENTO);

    expect(comUmSegredo).not.toBe(comOutro);
  });

  it('recusa chave que não tem trinta e dois bytes', () => {
    expect(
      () =>
        new DocumentoCrypto({ chaveDeCifra: randomBytes(16), segredoDaImpressao: randomBytes(32) }),
    ).toThrow(/trinta e dois/i);
  });
});
