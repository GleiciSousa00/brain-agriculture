import type { Documento } from './documento';
import type { Produtor } from './produtor';

/** O recorte que a listagem pede, contado em registros. */
export interface RecorteDeProdutores {
  deslocamento: number;
  limite: number;
}

/**
 * O resultado de uma listagem recortada.
 *
 * O total é o do cadastro inteiro, e não o desta fatia: é ele que diz quantas páginas
 * existem. Quem transforma isso na fatia que sai pela API é o caso de uso, porque contar
 * página é aritmética de apresentação e não de persistência.
 */
export interface ProdutoresRecortados {
  itens: Produtor[];
  total: number;
}

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
  list(recorte: RecorteDeProdutores): Promise<ProdutoresRecortados>;
}

/**
 * Chave do contêiner de injeção. Ela vive aqui, junto da porta, porque é a porta que está
 * sendo pedida; o arquivo de módulo é quem liga a implementação a ela.
 */
export const PRODUTOR_REPOSITORY = Symbol('ProdutorRepository');
