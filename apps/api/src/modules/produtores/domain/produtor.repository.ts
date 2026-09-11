import type { RecorteComBusca, Recortados } from '../../../shared/domain/recorte';
import type { Documento } from './documento';
import type { Produtor } from './produtor';

/**
 * O recorte da listagem de Produtores.
 *
 * Além do nome procurado, ela aceita um punhado de identificadores. É assim que a tela
 * resolve de uma vez o nome dos donos das Propriedades que está mostrando: sem isso o nome
 * sairia de um catálogo carregado de antemão, que para no teto da listagem e deixa sem nome
 * quem vier depois dele.
 */
export interface RecorteDeProdutores extends RecorteComBusca {
  /** Os identificadores pedidos. Ausente, lista todo mundo; vazio, não lista ninguém. */
  ids?: string[];
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
  list(recorte: RecorteDeProdutores): Promise<Recortados<Produtor>>;
}

/**
 * Chave do contêiner de injeção. Ela vive aqui, junto da porta, porque é a porta que está
 * sendo pedida; o arquivo de módulo é quem liga a implementação a ela.
 */
export const PRODUTOR_REPOSITORY = Symbol('ProdutorRepository');
