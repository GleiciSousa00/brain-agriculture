import { DomainError, type NaturezaDaFalha } from '../../../shared/domain/domain-error';

/** O Documento informado não é um CPF nem um CNPJ válido. */
export class DocumentoInvalido extends DomainError {
  readonly codigo = 'documento-invalido';
  readonly natureza: NaturezaDaFalha = 'entrada-invalida';
}
