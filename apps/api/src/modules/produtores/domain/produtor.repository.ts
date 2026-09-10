import type { Documento } from './documento';
import type { Produtor } from './produtor';

/** Porta de persistência do Produtor. Quem a implementa mora em `infrastructure`. */
export interface ProdutorRepository {
  save(produtor: Produtor): Promise<void>;
  findById(id: string): Promise<Produtor | null>;
  findByDocumento(documento: Documento): Promise<Produtor | null>;
}

/**
 * Chave do contêiner de injeção. Ela vive aqui, junto da porta, porque é a porta que está
 * sendo pedida; o arquivo de módulo é quem liga a implementação a ela.
 */
export const PRODUTOR_REPOSITORY = Symbol('ProdutorRepository');
