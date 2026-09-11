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

/**
 * O recorte de uma listagem que também se procura por nome.
 *
 * Nem toda listagem procura: Plantio se lista pela Propriedade, e não por texto. Por isso
 * a busca é um recorte à parte, e não um campo opcional que todas as portas passariam a
 * declarar sem usar.
 */
export interface RecorteComBusca extends Recorte {
  /** Pedaço do nome procurado, sem caixa nem acento a respeitar. Ausente, lista tudo. */
  busca?: string;
}

export interface Recortados<T> {
  itens: T[];
  /** Quantos registros existem ao todo, e não quantos vieram neste recorte. */
  total: number;
}
