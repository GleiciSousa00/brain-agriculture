import { DocumentoInvalido } from './documento.errors';

export type TipoDeDocumento = 'CPF' | 'CNPJ';

/** Ponto, barra e hífen são os separadores da máscara, e saem antes da conferência. */
const SEPARADORES = /[.\-/]/g;

const CPF_COMPRIMENTO = 11;
const CNPJ_COMPRIMENTO = 14;

const CPF_SO_DIGITOS = /^\d{11}$/;
const CPF_REPETIDO = /^(\d)\1{10}$/;

/** Doze posições alfanuméricas maiúsculas e dois dígitos verificadores numéricos. */
const CNPJ_FORMATO = /^[A-Z0-9]{12}\d{2}$/;
const CNPJ_ZERADO = '00000000000000';

const CPF_PESOS = {
  primeiro: [10, 9, 8, 7, 6, 5, 4, 3, 2],
  segundo: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
};

const CNPJ_PESOS = {
  primeiro: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  segundo: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
};

/**
 * O CPF ou o CNPJ que identifica um Produtor.
 *
 * A validação segue o código de referência da Receita Federal, e diverge de propósito das
 * bibliotecas populares em dois pontos: CNPJ com caracteres repetidos é válido, e CNPJ
 * pode conter letras maiúsculas nas doze primeiras posições. Ver
 * `docs/adr/0008-validacao-de-documento-segue-a-norma-da-receita.md`.
 */
export class Documento {
  private constructor(
    /** O valor sem máscara, como entra no cálculo e sai para a cifra. */
    readonly valor: string,
    readonly tipo: TipoDeDocumento,
  ) {}

  /** Devolve o Documento ou recusa a entrada dizendo o que está errado. */
  static criar(entrada: string): Documento {
    const semMascara = (entrada ?? '').replace(SEPARADORES, '');

    if (semMascara.length === CPF_COMPRIMENTO) {
      conferirCpf(semMascara);
      return new Documento(semMascara, 'CPF');
    }

    if (semMascara.length === CNPJ_COMPRIMENTO) {
      conferirCnpj(semMascara);
      return new Documento(semMascara, 'CNPJ');
    }

    throw new DocumentoInvalido(
      'O Documento precisa ter onze caracteres, no CPF, ou catorze, no CNPJ.',
    );
  }

  /**
   * Um Documento que já existe e está voltando da persistência.
   *
   * O tipo sai só do comprimento, e a validação da Receita não roda de novo: um Documento
   * gravado sob a regra de ontem continua legível sob a regra de hoje, mesmo que a regra
   * tenha apertado no meio do caminho. Comprimento fora de onze ou catorze é outra coisa:
   * é dado corrompido, porque não existe tipo possível para ele. Recebe o valor sem
   * máscara, como `paraLinha` gravou: com máscara o CPF chega a catorze caracteres e cairia
   * calado no ramo do CNPJ.
   */
  static restaurar(valor: string): Documento {
    if (valor.length === CPF_COMPRIMENTO) {
      return new Documento(valor, 'CPF');
    }

    if (valor.length === CNPJ_COMPRIMENTO) {
      return new Documento(valor, 'CNPJ');
    }

    throw new DocumentoInvalido(
      'O Documento gravado não tem onze caracteres, do CPF, nem catorze, do CNPJ.',
    );
  }

  /** A forma que a API devolve: só os dois últimos grupos aparecem. */
  mascarado(): string {
    return this.tipo === 'CPF'
      ? `***.***.${this.valor.slice(6, 9)}-${this.valor.slice(9)}`
      : `**.***.***/${this.valor.slice(8, 12)}-${this.valor.slice(12)}`;
  }

  igualA(outro: Documento): boolean {
    return this.valor === outro.valor;
  }
}

function conferirCpf(valor: string): void {
  if (!CPF_SO_DIGITOS.test(valor)) {
    throw new DocumentoInvalido('O CPF aceita apenas dígitos.');
  }

  if (CPF_REPETIDO.test(valor)) {
    throw new DocumentoInvalido('O CPF não pode ter todos os dígitos iguais.');
  }

  conferirDigitosVerificadores(valor, digitosDoCpf(valor), CPF_PESOS, 'CPF');
}

function conferirCnpj(valor: string): void {
  if (!CNPJ_FORMATO.test(valor)) {
    throw new DocumentoInvalido(
      'O CNPJ aceita dígitos e letras maiúsculas nas doze primeiras posições, e dígitos nas duas últimas.',
    );
  }

  if (valor === CNPJ_ZERADO) {
    throw new DocumentoInvalido('O CNPJ zerado não é válido.');
  }

  conferirDigitosVerificadores(valor, valoresDoCnpj(valor), CNPJ_PESOS, 'CNPJ');
}

/** No CPF cada posição vale o próprio dígito. */
function digitosDoCpf(valor: string): number[] {
  return [...valor].map(Number);
}

/**
 * No CNPJ cada posição vale o código do caractere menos quarenta e oito, o que faz `0`
 * valer zero e `A` valer dezessete. É esse deslocamento, e não um `if`, que faz o mesmo
 * laço atender o CNPJ numérico e o alfanumérico.
 */
function valoresDoCnpj(valor: string): number[] {
  return [...valor].map((caractere) => caractere.charCodeAt(0) - 48);
}

interface Pesos {
  primeiro: number[];
  segundo: number[];
}

function conferirDigitosVerificadores(
  valor: string,
  valores: number[],
  pesos: Pesos,
  tipo: TipoDeDocumento,
): void {
  const base = valores.slice(0, pesos.primeiro.length);
  const primeiro = digitoVerificador(base, pesos.primeiro);
  const segundo = digitoVerificador([...base, primeiro], pesos.segundo);

  if (valor.slice(-2) !== `${primeiro}${segundo}`) {
    throw new DocumentoInvalido(`O dígito verificador do ${tipo} não confere.`);
  }
}

function digitoVerificador(valores: number[], pesos: number[]): number {
  const soma = valores.reduce((total, atual, indice) => total + atual * (pesos[indice] ?? 0), 0);
  const resto = soma % 11;

  return resto < 2 ? 0 : 11 - resto;
}
