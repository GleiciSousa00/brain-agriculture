import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';
const TAMANHO_DA_CHAVE = 32;
const TAMANHO_DO_NONCE = 12;
const SEPARADOR = '.';

/**
 * As duas derivações do Documento que vão para o banco, conforme o registro 0002.
 *
 * A cifra é para exibição e usa nonce aleatório, o que faz o mesmo Documento virar bytes
 * diferentes a cada gravação. É justamente por isso que a unicidade não pode se apoiar
 * nela, e existe a impressão: um HMAC com segredo da aplicação, determinístico. O segredo
 * é o que impede percorrer o espaço de CPFs válidos por força bruta caso a coluna vaze.
 */
export class DocumentoCrypto {
  constructor(
    private readonly chaveDeCifra: Buffer,
    private readonly segredoDaImpressao: Buffer,
  ) {
    conferirTamanho(chaveDeCifra, 'a chave de cifra');
    conferirTamanho(segredoDaImpressao, 'o segredo da impressão');
  }

  /** Devolve nonce, etiqueta de autenticação e texto cifrado, em base64, separados por ponto. */
  cifrar(valor: string): string {
    const nonce = randomBytes(TAMANHO_DO_NONCE);
    const cifra = createCipheriv(ALGORITMO, this.chaveDeCifra, nonce);
    const cifrado = Buffer.concat([cifra.update(valor, 'utf8'), cifra.final()]);

    return [nonce, cifra.getAuthTag(), cifrado].map((parte) => parte.toString('base64')).join(SEPARADOR);
  }

  /** Recusa o pacote se ele tiver sido adulterado: o GCM autentica além de cifrar. */
  decifrar(pacote: string): string {
    const [nonce, etiqueta, cifrado] = pacote.split(SEPARADOR).map((parte) => Buffer.from(parte, 'base64'));

    if (nonce === undefined || etiqueta === undefined || cifrado === undefined) {
      throw new Error('O pacote cifrado do Documento não tem as três partes esperadas.');
    }

    const decifra = createDecipheriv(ALGORITMO, this.chaveDeCifra, nonce);
    decifra.setAuthTag(etiqueta);

    return Buffer.concat([decifra.update(cifrado), decifra.final()]).toString('utf8');
  }

  /** O valor determinístico sobre o qual a restrição de unicidade é declarada. */
  impressao(valor: string): string {
    return createHmac('sha256', this.segredoDaImpressao).update(valor, 'utf8').digest('hex');
  }

  /** Comparação em tempo constante, para quando a impressão vier de fora. */
  static impressoesIguais(uma: string, outra: string): boolean {
    const primeira = Buffer.from(uma, 'hex');
    const segunda = Buffer.from(outra, 'hex');

    return primeira.length === segunda.length && timingSafeEqual(primeira, segunda);
  }
}

function conferirTamanho(material: Buffer, nome: string): void {
  if (material.length !== TAMANHO_DA_CHAVE) {
    throw new Error(`O material de ${nome} precisa ter trinta e dois bytes.`);
  }
}
