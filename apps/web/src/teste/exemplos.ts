import type { Painel } from '@cadastro-rural/contracts';

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

export const SAFRA_DE_2025 = { id: 'safra-2025', ano: 2025 };
export const SAFRA_DE_2024 = { id: 'safra-2024', ano: 2024 };
