import type { Recorte, Recortados } from '../../../shared/domain/recorte';
import type { Documento } from './documento';
import type { Produtor } from './produtor';

/** Porta de persistência do Produtor. Quem a implementa mora em `infrastructure`. */
export interface ProdutorRepository {
  save(produtor: Produtor): Promise<void>;
  /** Grava de volta um Produtor que já existe. O Documento não é alterável. */
  update(produtor: Produtor): Promise<void>;
  /** Exclusão física, conforme o registro 0003. */
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Produtor | null>;
  findByDocumento(documento: Documento): Promise<Produtor | null>;
  /** Lista em ordem de nome, com o identificador desempatando homônimos. */
  list(recorte: Recorte): Promise<Recortados<Produtor>>;
}

/**
 * Chave do contêiner de injeção. Ela vive aqui, junto da porta, porque é a porta que está
 * sendo pedida; o arquivo de módulo é quem liga a implementação a ela.
 */
export const PRODUTOR_REPOSITORY = Symbol('ProdutorRepository');
