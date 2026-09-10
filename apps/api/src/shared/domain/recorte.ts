/**
 * A fatia de uma listagem, dita em vocabulário de porta de repositório.
 *
 * Ela mora em `shared/domain`, e não em `shared/application`, porque quem a nomeia são as
 * portas, que vivem no `domain` de cada módulo, e `domain` não enxerga `application`. Ver
 * o registro 0005.
 *
 * A porta fala em deslocamento e limite, e não em página, pelo mesmo motivo: página é
 * vocabulário de caso de uso. Quem converte um no outro é `paginar`, em
 * `shared/application/pagina.ts`.
 */
export interface Recorte {
  deslocamento: number;
  limite: number;
}

export interface Recortados<T> {
  itens: T[];
  /** Quantos registros existem ao todo, e não quantos vieram neste recorte. */
  total: number;
}
