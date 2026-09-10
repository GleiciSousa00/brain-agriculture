/**
 * O conjunto de dados de exemplo do cadastro.
 *
 * Ele serve a duas coisas ao mesmo tempo: a carga que enche o painel de quem sobe a
 * aplicação pela primeira vez, e o cenário que o teste de integração do painel confere
 * contra o Postgres. É um arquivo só de propósito. Dois conjuntos parecidos divergiriam, e
 * o teste passaria a provar um cadastro que ninguém vê.
 *
 * O conjunto é pequeno e escolhido a dedo para que os três gráficos digam algo:
 *
 * - Cinco Propriedades em quatro estados, com Mato Grosso aparecendo duas vezes, para a
 *   distribuição por estado não sair com todas as fatias iguais.
 * - Quatro Culturas com contagens diferentes entre si, e diferentes de novo quando a Safra
 *   de 2024 é o recorte. Contagens empatadas seriam desempatadas pelo identificador da
 *   Cultura, que é sorteado na carga, e a ordem do gráfico deixaria de ser previsível.
 * - Área Agricultável e Área de Vegetação que somam exatamente a Área Total em cada
 *   Propriedade, que é o que a regra da soma exige.
 *
 * Os números que este conjunto produz no painel estão conferidos à mão no teste de
 * integração. Mexer aqui muda lá.
 *
 * As Culturas são nomeadas, e não identificadas: elas vêm da carga inicial do catálogo, e
 * quem carrega procura o identificador pelo nome. Os Documentos são válidos pela norma da
 * Receita, dois CPF e um CNPJ, porque a carga entra pela API e a API os confere.
 */

/** Uma Cultura registrada em uma Propriedade em uma Safra. */
export interface PlantioDeExemplo {
  /** O nome como está na carga inicial do catálogo. */
  cultura: string;
  ano: number;
}

export interface PropriedadeDeExemplo {
  cidade: string;
  estado: string;
  areaTotal: number;
  areaAgricultavel: number;
  areaDeVegetacao: number;
  plantios: PlantioDeExemplo[];
}

export interface ProdutorDeExemplo {
  documento: string;
  nome: string;
  propriedades: PropriedadeDeExemplo[];
}

/** Os ciclos que o conjunto usa. A carga cria os que faltarem. */
export const SAFRAS_DE_EXEMPLO = [2023, 2024, 2025];

export const PRODUTORES_DE_EXEMPLO: ProdutorDeExemplo[] = [
  {
    documento: '528.194.360-05',
    nome: 'Maria Aparecida Nogueira',
    propriedades: [
      {
        cidade: 'Sorriso',
        estado: 'MT',
        areaTotal: 1200,
        areaAgricultavel: 900,
        areaDeVegetacao: 300,
        plantios: [
          { cultura: 'Soja', ano: 2024 },
          { cultura: 'Milho', ano: 2024 },
          { cultura: 'Soja', ano: 2025 },
        ],
      },
      {
        cidade: 'Rio Verde',
        estado: 'GO',
        areaTotal: 800,
        areaAgricultavel: 500,
        areaDeVegetacao: 300,
        plantios: [
          { cultura: 'Soja', ano: 2024 },
          { cultura: 'Milho', ano: 2024 },
        ],
      },
    ],
  },
  {
    documento: '712.340.581-11',
    nome: 'João Batista Ferreira',
    propriedades: [
      {
        cidade: 'Uberaba',
        estado: 'MG',
        areaTotal: 450,
        areaAgricultavel: 300,
        areaDeVegetacao: 150,
        plantios: [
          { cultura: 'Café', ano: 2024 },
          { cultura: 'Café', ano: 2025 },
        ],
      },
      {
        cidade: 'Sinop',
        estado: 'MT',
        areaTotal: 300,
        areaAgricultavel: 200,
        areaDeVegetacao: 100,
        plantios: [
          { cultura: 'Soja', ano: 2024 },
          { cultura: 'Milho', ano: 2023 },
        ],
      },
    ],
  },
  {
    documento: '38.427.561/0001-44',
    nome: 'Agropecuária Vale Verde Ltda',
    propriedades: [
      {
        cidade: 'Petrolina',
        estado: 'PE',
        areaTotal: 250,
        areaAgricultavel: 150,
        areaDeVegetacao: 100,
        plantios: [{ cultura: 'Algodão', ano: 2025 }],
      },
    ],
  },
];

/** Quantas linhas o conjunto tem, para quem carrega dizer o que fez. */
export const TAMANHO_DO_EXEMPLO = {
  produtores: PRODUTORES_DE_EXEMPLO.length,
  propriedades: PRODUTORES_DE_EXEMPLO.reduce(
    (total, produtor) => total + produtor.propriedades.length,
    0,
  ),
  plantios: PRODUTORES_DE_EXEMPLO.reduce(
    (total, produtor) =>
      total +
      produtor.propriedades.reduce(
        (doProdutor, propriedade) => doProdutor + propriedade.plantios.length,
        0,
      ),
    0,
  ),
  safras: SAFRAS_DE_EXEMPLO.length,
};
