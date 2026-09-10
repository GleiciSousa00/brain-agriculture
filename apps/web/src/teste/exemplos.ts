import type { Cultura, Painel, Produtor, Propriedade, Safra } from '@cadastro-rural/contracts';

/** O painel de uma base recém-criada: zeros e listas vazias, como a API o devolve. */
export const PAINEL_VAZIO: Painel = {
  totais: { propriedades: 0, areaTotal: 0 },
  usoDoSolo: { areaAgricultavel: 0, areaDeVegetacao: 0 },
  propriedadesPorEstado: [],
  plantiosPorCultura: [],
};

/** Um painel com números redondos, escolhidos para que as porcentagens sejam exatas. */
export const PAINEL_COM_DADOS: Painel = {
  totais: { propriedades: 4, areaTotal: 1234.5 },
  usoDoSolo: { areaAgricultavel: 800, areaDeVegetacao: 434.5 },
  propriedadesPorEstado: [
    { estado: 'MG', propriedades: 3 },
    { estado: 'SP', propriedades: 1 },
  ],
  plantiosPorCultura: [
    { culturaId: 'c1', cultura: 'Soja', plantios: 4 },
    { culturaId: 'c2', cultura: 'Milho', plantios: 1 },
  ],
};

export const SAFRA_DE_2025: Safra = { id: 'safra-2025', ano: 2025 };
export const SAFRA_DE_2024: Safra = { id: 'safra-2024', ano: 2024 };

/** Uma pessoa física, com o Documento já mascarado como a API o devolve. */
export const ANA: Produtor = {
  id: 'produtor-ana',
  nome: 'Ana Lima',
  documento: '***.456.789-00',
  tipoDeDocumento: 'CPF',
};

/** Uma pessoa jurídica, para que a tabela mostre os dois tipos de Documento. */
export const AGRO_BETO: Produtor = {
  id: 'produtor-beto',
  nome: 'Agro Beto',
  documento: '**.***.678/0001-90',
  tipoDeDocumento: 'CNPJ',
};

/** Duas Propriedades na mesma cidade, que é o caso que o nome existe para resolver. */
export const BOA_VISTA: Propriedade = {
  id: 'propriedade-boa-vista',
  produtorId: ANA.id,
  nome: 'Fazenda Boa Vista',
  cidade: 'Uberaba',
  estado: 'MG',
  areaTotal: 100,
  areaAgricultavel: 60,
  areaDeVegetacao: 30,
};

export const SITIO_DO_MEIO: Propriedade = {
  id: 'propriedade-sitio',
  produtorId: ANA.id,
  nome: 'Sítio do Meio',
  cidade: 'Uberaba',
  estado: 'MG',
  areaTotal: 40,
  areaAgricultavel: 20,
  areaDeVegetacao: 15,
};

export const SOJA: Cultura = { id: 'cultura-soja', nome: 'Soja' };
export const MILHO: Cultura = { id: 'cultura-milho', nome: 'Milho' };
