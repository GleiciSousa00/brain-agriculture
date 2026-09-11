import { randomUUID } from 'node:crypto';

/**
 * O conjunto sintético da carga de volume, e a regra que o monta.
 *
 * A carga de volume existe para a medição do painel valer alguma coisa, e por isso precisa
 * de cem mil Plantios. Mas ela também é o cadastro que alguém abre em produção, e um
 * cadastro onde tudo é igual não mostra nada: um Produtor só, um estado por fatia igual à
 * outra, e todas as Propriedades plantando todas as Culturas em todas as Safras.
 *
 * Este arquivo resolve as duas coisas ao mesmo tempo. Os dados continuam sintéticos e
 * assumidos como tais, mas a distribuição deixa de ser plana:
 *
 * - Os Produtores são cinquenta, e não os que por acaso já estavam na base. Quarenta
 *   pessoas físicas e dez jurídicas, com Documento válido pela norma da Receita, porque a
 *   carga os cria pela API e a API os confere.
 * - As Propriedades se repartem em escada entre eles: o primeiro fica com uma, o segundo
 *   com duas, e assim por diante. Nenhum Produtor fica sem, e nem todos ficam iguais.
 * - A cidade e o estado saem de uma lista de localidades reais, e o peso de cada estado é
 *   quantas cidades ele põe na lista. Mato Grosso entra com seis, o Acre com uma.
 * - A quantidade de Culturas e de Safras varia por Propriedade, e as duas listas são
 *   percorridas da mais comum para a menos comum. É o que faz o gráfico por Cultura ter
 *   fatias diferentes e o recorte por Safra mudar o desenho.
 *
 * Nada aqui sorteia: as mesmas entradas dão a mesma carga. Uma carga que muda a cada
 * execução tornaria a medição do painel incomparável entre duas execuções.
 */

/** Um Produtor sintético, como a carga o envia para a API. */
export interface ProdutorDeVolume {
  documento: string;
  nome: string;
}

/**
 * Os cinquenta Produtores da carga de volume.
 *
 * São cinquenta, e não quinhentos, porque a tela do cadastro resolve o nome do Produtor
 * pela primeira página do catálogo, que vai até cem. Passando disso a coluna Produtor da
 * listagem de Propriedade cairia num travessão, que é pior do que o problema que esta
 * carga veio consertar.
 *
 * Os Documentos são válidos e fixos. Gerá-los na hora exigiria repetir aqui o cálculo do
 * dígito verificador que o domínio já faz, e duas cópias dessa conta divergem.
 */
export const PRODUTORES_DE_VOLUME: ProdutorDeVolume[] = [
  { documento: '317.482.596-28', nome: 'Ana Paula Rezende' },
  { documento: '329.828.273-10', nome: 'Carlos Eduardo Munhoz' },
  { documento: '342.173.950-19', nome: 'Beatriz Almeida Prado' },
  { documento: '354.519.627-58', nome: 'Rafael Nogueira Lima' },
  { documento: '366.865.304-68', nome: 'Luciana Ferraz Tavares' },
  { documento: '379.210.981-69', nome: 'Marcos Vinícius Dantas' },
  { documento: '391.556.658-61', nome: 'Patrícia Cordeiro Vaz' },
  { documento: '403.902.335-87', nome: 'Eduardo Sampaio Rocha' },
  { documento: '416.248.012-50', nome: 'Juliana Bastos Camargo' },
  { documento: '428.593.689-57', nome: 'Fernando Queiroz Matos' },
  { documento: '440.939.366-92', nome: 'Renata Villela Antunes' },
  { documento: '453.285.043-64', nome: 'Gustavo Peixoto Barreto' },
  { documento: '465.630.720-38', nome: 'Camila Andrade Fontes' },
  { documento: '477.976.397-52', nome: 'Thiago Moraes Bittencourt' },
  { documento: '490.322.074-58', nome: 'Vanessa Ribeiro Gouveia' },
  { documento: '502.667.751-79', nome: 'Leandro Pacheco Aguiar' },
  { documento: '515.013.428-78', nome: 'Simone Teixeira Braga' },
  { documento: '527.359.105-80', nome: 'Rodrigo Vasconcelos Pinto' },
  { documento: '539.704.782-19', nome: 'Adriana Lemos Siqueira' },
  { documento: '552.050.459-81', nome: 'Otávio Bernardes Maciel' },
  { documento: '564.396.136-93', nome: 'Cristina Barbosa Falcão' },
  { documento: '576.741.813-67', nome: 'Henrique Duarte Salgado' },
  { documento: '589.087.490-04', nome: 'Mariana Cavalcanti Nunes' },
  { documento: '601.433.167-02', nome: 'Paulo Sérgio Vilela' },
  { documento: '613.778.844-06', nome: 'Débora Fagundes Correia' },
  { documento: '626.124.521-50', nome: 'Alexandre Toledo Pimentel' },
  { documento: '638.470.198-72', nome: 'Tatiana Moreira Bandeira' },
  { documento: '650.815.875-91', nome: 'Ricardo Amaral Guimarães' },
  { documento: '663.161.552-63', nome: 'Silvana Pires Drummond' },
  { documento: '675.507.229-00', nome: 'Gabriel Monteiro Assunção' },
  { documento: '687.852.906-96', nome: 'Elaine Castro Portela' },
  { documento: '700.198.583-02', nome: 'Vinicius Leite Sarmento' },
  { documento: '712.544.260-94', nome: 'Rosana Figueiredo Alves' },
  { documento: '724.889.937-27', nome: 'Márcio Brandão Cunha' },
  { documento: '737.235.614-89', nome: 'Letícia Xavier Bonfim' },
  { documento: '749.581.291-54', nome: 'Joaquim Neves Estrela' },
  { documento: '761.926.968-10', nome: 'Priscila Machado Valente' },
  { documento: '774.272.645-92', nome: 'Anderson Coelho Ramires' },
  { documento: '786.618.322-84', nome: 'Verônica Padilha Serra' },
  { documento: '798.963.999-80', nome: 'Sérgio Luiz Trindade' },
  { documento: '24.831.705/0001-19', nome: 'Agropecuária Serra Dourada Ltda' },
  { documento: '27.973.298/0001-72', nome: 'Fazendas Reunidas Palmares S.A.' },
  { documento: '31.114.891/0001-30', nome: 'Grupo Rural Vale do Araguaia Ltda' },
  { documento: '34.256.484/0001-56', nome: 'Agrícola Campos Gerais Ltda' },
  { documento: '37.398.077/0001-71', nome: 'Sementes Terra Boa Agronegócios Ltda' },
  { documento: '40.539.670/0001-03', nome: 'Cerrado Alto Agropecuária Ltda' },
  { documento: '43.681.263/0001-16', nome: 'Companhia Agrícola Rio das Garças' },
  { documento: '46.822.856/0001-43', nome: 'Nova Fronteira Agro Ltda' },
  { documento: '49.964.449/0001-69', nome: 'Irmãos Bertolo Agropecuária Ltda' },
  { documento: '53.106.042/0001-78', nome: 'Planalto Central Agroindustrial S.A.' },
];

/** Onde uma Propriedade fica. */
interface Localidade {
  cidade: string;
  estado: string;
}

/**
 * As localidades da carga, e com elas o peso de cada estado.
 *
 * A carga percorre esta lista em volta, então um estado pesa quantas cidades ele põe aqui.
 * As vinte e sete siglas aparecem, porque o gráfico por estado é do país inteiro, mas não
 * aparecem em partes iguais: seria a mesma fatia vinte e sete vezes, que é um gráfico que
 * não informa.
 */
const LOCALIDADES: Localidade[] = [
  { cidade: 'Sorriso', estado: 'MT' },
  { cidade: 'Sinop', estado: 'MT' },
  { cidade: 'Lucas do Rio Verde', estado: 'MT' },
  { cidade: 'Primavera do Leste', estado: 'MT' },
  { cidade: 'Campo Novo do Parecis', estado: 'MT' },
  { cidade: 'Nova Mutum', estado: 'MT' },
  { cidade: 'Rio Verde', estado: 'GO' },
  { cidade: 'Jataí', estado: 'GO' },
  { cidade: 'Cristalina', estado: 'GO' },
  { cidade: 'Catalão', estado: 'GO' },
  { cidade: 'Mineiros', estado: 'GO' },
  { cidade: 'Cascavel', estado: 'PR' },
  { cidade: 'Ponta Grossa', estado: 'PR' },
  { cidade: 'Londrina', estado: 'PR' },
  { cidade: 'Guarapuava', estado: 'PR' },
  { cidade: 'Toledo', estado: 'PR' },
  { cidade: 'Cruz Alta', estado: 'RS' },
  { cidade: 'Passo Fundo', estado: 'RS' },
  { cidade: 'Santa Rosa', estado: 'RS' },
  { cidade: 'Ijuí', estado: 'RS' },
  { cidade: 'Tupanciretã', estado: 'RS' },
  { cidade: 'Dourados', estado: 'MS' },
  { cidade: 'Maracaju', estado: 'MS' },
  { cidade: 'Sidrolândia', estado: 'MS' },
  { cidade: 'Chapadão do Sul', estado: 'MS' },
  { cidade: 'Uberaba', estado: 'MG' },
  { cidade: 'Uberlândia', estado: 'MG' },
  { cidade: 'Patos de Minas', estado: 'MG' },
  { cidade: 'Unaí', estado: 'MG' },
  { cidade: 'Luís Eduardo Magalhães', estado: 'BA' },
  { cidade: 'Barreiras', estado: 'BA' },
  { cidade: 'São Desidério', estado: 'BA' },
  { cidade: 'Correntina', estado: 'BA' },
  { cidade: 'Ribeirão Preto', estado: 'SP' },
  { cidade: 'Piracicaba', estado: 'SP' },
  { cidade: 'Araçatuba', estado: 'SP' },
  { cidade: 'Itapeva', estado: 'SP' },
  { cidade: 'Balsas', estado: 'MA' },
  { cidade: 'Tasso Fragoso', estado: 'MA' },
  { cidade: 'Riachão', estado: 'MA' },
  { cidade: 'Pedro Afonso', estado: 'TO' },
  { cidade: 'Campos Lindos', estado: 'TO' },
  { cidade: 'Porto Nacional', estado: 'TO' },
  { cidade: 'Uruçuí', estado: 'PI' },
  { cidade: 'Bom Jesus', estado: 'PI' },
  { cidade: 'Baixa Grande do Ribeiro', estado: 'PI' },
  { cidade: 'Chapecó', estado: 'SC' },
  { cidade: 'Campos Novos', estado: 'SC' },
  { cidade: 'Xanxerê', estado: 'SC' },
  { cidade: 'Paragominas', estado: 'PA' },
  { cidade: 'Santarém', estado: 'PA' },
  { cidade: 'Vilhena', estado: 'RO' },
  { cidade: 'Cerejeiras', estado: 'RO' },
  { cidade: 'Petrolina', estado: 'PE' },
  { cidade: 'Araripina', estado: 'PE' },
  { cidade: 'Quixadá', estado: 'CE' },
  { cidade: 'Crateús', estado: 'CE' },
  { cidade: 'Linhares', estado: 'ES' },
  { cidade: 'São Mateus', estado: 'ES' },
  { cidade: 'Mossoró', estado: 'RN' },
  { cidade: 'Apodi', estado: 'RN' },
  { cidade: 'Arapiraca', estado: 'AL' },
  { cidade: 'Penedo', estado: 'AL' },
  { cidade: 'Sousa', estado: 'PB' },
  { cidade: 'Catolé do Rocha', estado: 'PB' },
  { cidade: 'Simão Dias', estado: 'SE' },
  { cidade: 'Nossa Senhora das Dores', estado: 'SE' },
  { cidade: 'Rio Branco', estado: 'AC' },
  { cidade: 'Humaitá', estado: 'AM' },
  { cidade: 'Macapá', estado: 'AP' },
  { cidade: 'Boa Vista', estado: 'RR' },
  { cidade: 'Campos dos Goytacazes', estado: 'RJ' },
  { cidade: 'Brasília', estado: 'DF' },
];

/** O que vem antes do nome de uma Propriedade. */
const PREFIXOS = ['Fazenda', 'Sítio', 'Estância', 'Chácara'];

/**
 * Os núcleos do nome de uma Propriedade.
 *
 * Nenhum deles repete um nome do conjunto de exemplo: duas Propriedades com o mesmo nome
 * na listagem seriam indistinguíveis, que é exatamente o problema que o nome resolve.
 */
const NUCLEOS = [
  'Boa Vista',
  'Santa Rita',
  'São João',
  'Água Limpa',
  'Três Barras',
  'Bela Vista',
  'Santa Luzia',
  'Recanto Verde',
  'Bom Retiro',
  'Monte Alegre',
  'Santo Antônio',
  'Vale do Sol',
  'Rio Claro',
  'Campo Belo',
  'Serra Azul',
  'Ouro Verde',
  'Boa Sorte',
  'São Sebastião',
  'Cachoeira Alta',
  'Alto da Serra',
  'Barra Mansa',
  'Pedra Branca',
  'Céu Azul',
  'Dois Irmãos',
  'Estrela do Norte',
  'Flor da Mata',
  'Palmeiras',
  'Horizonte',
  'Ipê Amarelo',
  'Jacarandá',
  'Lagoa Nova',
  'Morro Grande',
  'Nova Aliança',
  'Paraíso',
  'Canaã',
  'Riacho Fundo',
  'Sete Lagoas',
  'Tijuco Preto',
  'Água Boa',
  'Bom Jardim',
];

/**
 * Uma Propriedade da carga, já resolvida, e quanto do catálogo ela planta.
 *
 * `culturas` e `safras` não são listas: são quantidades. A carga percorre o catálogo do
 * mais comum para o menos comum e corta na quantidade, e é esse corte que faz a Soja
 * aparecer em toda Propriedade e o Sorgo em poucas.
 */
export interface PropriedadeDeVolume {
  id: string;
  produtorId: string;
  nome: string;
  cidade: string;
  estado: string;
  areaTotal: number;
  areaAgricultavel: number;
  areaDeVegetacao: number;
  /** Quantas das Culturas mais comuns esta Propriedade planta. De uma a dez. */
  culturas: number;
  /** Quantas das Safras mais recentes esta Propriedade cobre. De duas a dez. */
  safras: number;
}

/** Quanto o catálogo oferece de verdade, que é o teto do que uma Propriedade planta. */
export interface CatalogoDisponivel {
  culturas: number;
  safras: number;
}

/**
 * Monta as Propriedades até o alvo de Plantios, e nem uma a mais.
 *
 * A última Propriedade passa do alvo em vez de ficar aquém dele: cortá-la ao meio
 * significaria uma Propriedade com menos Cultura do que a regra pede, e o alvo é um piso.
 *
 * O catálogo entra como teto porque ele é editável. Pedir a décima Cultura de um catálogo
 * com seis daria uma carga menor do que a anunciada, e o número anunciado é o que a
 * medição do painel registra.
 */
export function planejarVolume(
  produtores: string[],
  catalogo: CatalogoDisponivel,
  alvoDePlantios: number,
): PropriedadeDeVolume[] {
  if (produtores.length === 0) {
    throw new Error('A carga de volume precisa de Produtor para pendurar as Propriedades.');
  }

  if (catalogo.culturas === 0 || catalogo.safras === 0) {
    throw new Error('Sem Cultura ou sem Safra não há Plantio, e a carga não teria o que gravar.');
  }

  const propriedades: PropriedadeDeVolume[] = [];
  let produtor = 0;
  let faltamNesteProdutor = 1;
  let plantios = 0;

  for (let n = 0; plantios < alvoDePlantios; n += 1) {
    if (faltamNesteProdutor === 0) {
      produtor = (produtor + 1) % produtores.length;
      faltamNesteProdutor = produtor + 1;
    }

    faltamNesteProdutor -= 1;
    const propriedade = montar(n, naVolta(produtores, produtor), catalogo);
    propriedades.push(propriedade);
    plantios += propriedade.culturas * propriedade.safras;
  }

  return propriedades;
}

/** Quantos Plantios um plano produz. A carga anuncia isto, e o teste o confere. */
export function plantiosDoPlano(propriedades: PropriedadeDeVolume[]): number {
  return propriedades.reduce((total, uma) => total + uma.culturas * uma.safras, 0);
}

function montar(
  n: number,
  produtorId: string,
  catalogo: CatalogoDisponivel,
): PropriedadeDeVolume {
  const { cidade, estado } = naVolta(LOCALIDADES, n);
  // De quarenta a quase cinco mil hectares, sem degrau redondo entre uma e a seguinte.
  const areaTotal = 40 + ((n * 37) % 4800);
  // Entre quarenta e cinco e oitenta por cento da Área Total ficam para o cultivo.
  const areaAgricultavel = emHectares(areaTotal * (0.45 + (n % 36) / 100));

  return {
    id: randomUUID(),
    produtorId,
    nome: nomeDaPropriedade(n),
    cidade,
    estado,
    areaTotal,
    areaAgricultavel,
    // O resto, e não outra conta: a soma das duas tem de dar a Área Total exata.
    areaDeVegetacao: emHectares(areaTotal - areaAgricultavel),
    culturas: Math.min(1 + (n % 10), catalogo.culturas),
    safras: Math.min(2 + (n % 9), catalogo.safras),
  };
}

/**
 * O nome, montado do prefixo com o núcleo, e numerado quando a combinação volta.
 *
 * São cento e sessenta combinações. Passando delas o nome ganha o número da volta, como
 * "Sítio Boa Vista 2", que é como um cadastro de verdade distingue duas glebas do mesmo
 * nome.
 */
function nomeDaPropriedade(n: number): string {
  const combinacoes = PREFIXOS.length * NUCLEOS.length;
  const combinacao = n % combinacoes;
  const volta = Math.floor(n / combinacoes);
  const prefixo = naVolta(PREFIXOS, combinacao);
  const nucleo = naVolta(NUCLEOS, Math.floor(combinacao / PREFIXOS.length));

  return volta === 0 ? `${prefixo} ${nucleo}` : `${prefixo} ${nucleo} ${volta + 1}`;
}

/** Hectare com duas casas, que é o que a tela mostra e o que a regra da soma compara. */
function emHectares(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** O item na posição, com a lista dando a volta. */
function naVolta<T>(lista: readonly T[], indice: number): T {
  const item = lista[indice % lista.length];

  if (item === undefined) {
    throw new Error('A carga de volume pediu item de uma lista vazia.');
  }

  return item;
}
