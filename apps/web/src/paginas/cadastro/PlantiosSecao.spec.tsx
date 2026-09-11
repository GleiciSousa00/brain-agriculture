import type { Plantio } from '@cadastro-rural/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { procurarEEscolher } from '../../teste/busca-falsa';
import { paginar, plantioDe, renderizarNoCadastro, servirCadastro } from '../../teste/cadastro-falso';
import {
  ANA,
  BOA_VISTA,
  MILHO,
  SAFRA_DE_2024,
  SAFRA_DE_2025,
  SITIO_DO_MEIO,
  SOJA,
} from '../../teste/exemplos';
import { corpoEnviadoPara, servirRotas } from '../../teste/fetch-falso';
import { PlantiosSecao } from './PlantiosSecao';
import type { RotaFalsa } from '../../teste/fetch-falso';

const BASE = {
  produtores: [ANA],
  propriedades: [BOA_VISTA, SITIO_DO_MEIO],
  culturas: [SOJA, MILHO],
  safras: [SAFRA_DE_2025, SAFRA_DE_2024],
};

/** Serve os Plantios de cada Propriedade a partir de um vetor que o teste controla. */
function rotaDosPlantios(plantios: Plantio[]): Record<string, RotaFalsa> {
  return {
    'GET /api/propriedades/:propriedadeId/plantios': ({ url, parametros }) => ({
      corpo: paginar(
        plantios.filter((plantio) => plantio.propriedadeId === parametros.propriedadeId),
        url,
      ),
    }),
  };
}

async function escolher(rotulo: string, valor: string): Promise<void> {
  await userEvent.selectOptions(screen.getByLabelText(rotulo), valor);
}

/** O formulário nasce fechado: quem vai registrar pede por ele antes. */
async function abrirONovo(): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: 'Novo Plantio' }));
}

describe('a seção de Plantios', () => {
  it('pede uma Propriedade antes de mostrar Plantio nenhum', async () => {
    servirCadastro(BASE, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);

    expect(await screen.findByText(/Escolha uma Propriedade acima/)).toBeInTheDocument();
  });

  it('oferece só as Propriedades que casam com o nome procurado', async () => {
    servirCadastro(BASE, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);

    await userEvent.type(await screen.findByRole('combobox', { name: 'Propriedade' }), 'sitio');

    // O nome do Produtor vem junto: fora do recorte de um deles, o campo procura no
    // cadastro inteiro, e duas Propriedades podem ter nomes parecidos.
    expect(
      await screen.findByRole('option', { name: 'Sítio do Meio · Ana Lima' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Fazenda Boa Vista/ })).toBeNull();
  });

  it('nomeia no campo a Propriedade escolhida, por mais fundo que ela esteja no cadastro', async () => {
    // Ela é a última de cento e cinquenta: nenhuma lista carregada de antemão a alcança. O
    // campo mostrava um texto fixo no lugar do nome, e o nome é o que diz o que se escolheu.
    const distante = { ...SITIO_DO_MEIO, id: 'p-901', nome: 'Fazenda Distante' };
    const enfileiradas = Array.from({ length: 150 }, (_, indice) => ({
      ...BOA_VISTA,
      id: `propriedade-${String(indice)}`,
      nome: `Fazenda ${String(indice)}`,
    }));
    servirCadastro({ ...BASE, propriedades: [...enfileiradas, distante] }, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);
    await procurarEEscolher('Propriedade', 'distante', 'Fazenda Distante · Ana Lima');

    expect(await screen.findByRole('combobox', { name: 'Propriedade' })).toHaveValue(
      'Fazenda Distante',
    );
    expect(screen.queryByText('Propriedade fora do catálogo')).toBeNull();
    expect(
      await screen.findByRole('heading', { name: /Plantios de Fazenda Distante/ }),
    ).toBeInTheDocument();
  });

  it('mostra a cidade e a área da Propriedade escolhida, e não só o nome dela', async () => {
    const distante = { ...SITIO_DO_MEIO, id: 'p-901', nome: 'Fazenda Distante' };
    servirCadastro({ ...BASE, propriedades: [distante] }, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />, `/cadastro/plantios?propriedade=${distante.id}`);

    expect(await screen.findByText(/Uberaba\/MG/)).toBeInTheDocument();
  });

  it('com identificador inválido no endereço, diz o que a API recusou e nada mais', async () => {
    // A recusa do identificador malformado é uma só, e é a da API. A busca que nomearia a
    // Propriedade também é recusada, e ficar calada é o que evita dois avisos dizendo o mesmo.
    servirCadastro(BASE, {
      'GET /api/propriedades/:propriedadeId/plantios': () => ({
        problema: {
          status: 400,
          title: 'Bad Request',
          detail: 'O identificador informado não é um UUID.',
        },
      }),
    });

    renderizarNoCadastro(<PlantiosSecao />, '/cadastro/plantios?propriedade=nao-e-uuid');

    const avisos = await screen.findAllByRole('alert');
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toHaveTextContent('O identificador informado não é um UUID.');
  });

  it('mostra os Plantios da Propriedade escolhida, com Cultura e Safra por nome', async () => {
    servirCadastro(
      BASE,
      rotaDosPlantios([
        plantioDe('pl1', BOA_VISTA, SOJA, SAFRA_DE_2025),
        plantioDe('pl2', SITIO_DO_MEIO, MILHO, SAFRA_DE_2024),
      ]),
    );

    renderizarNoCadastro(<PlantiosSecao />);
    await screen.findByLabelText('Propriedade');

    await procurarEEscolher('Propriedade', 'boa vista', 'Fazenda Boa Vista · Ana Lima');

    const linha = await screen.findByRole('row', { name: /Soja/ });
    expect(within(linha).getByText('2025')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Milho/ })).toBeNull();
  });

  it('escolhe Cultura e Safra em listas, sem digitar texto livre', async () => {
    servirCadastro(BASE, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);
    await screen.findByLabelText('Propriedade');
    await procurarEEscolher('Propriedade', 'boa vista', 'Fazenda Boa Vista · Ana Lima');
    await abrirONovo();

    const cultura = screen.getByLabelText('Cultura');
    const safra = screen.getByLabelText('Safra');
    expect(cultura.tagName).toBe('SELECT');
    expect(safra.tagName).toBe('SELECT');
    expect(within(cultura).getByRole('option', { name: 'Soja' })).toBeInTheDocument();
    expect(within(safra).getByRole('option', { name: '2025' })).toBeInTheDocument();
  });

  it('registra o Plantio com a trinca da Propriedade escolhida', async () => {
    const plantios: Plantio[] = [];
    servirCadastro(BASE, {
      ...rotaDosPlantios(plantios),
      'POST /api/plantios': () => {
        plantios.push(plantioDe('pl1', BOA_VISTA, SOJA, SAFRA_DE_2025));

        return { corpo: plantios[0] };
      },
    });

    renderizarNoCadastro(<PlantiosSecao />);
    await screen.findByLabelText('Propriedade');
    await procurarEEscolher('Propriedade', 'boa vista', 'Fazenda Boa Vista · Ana Lima');
    await abrirONovo();

    await escolher('Cultura', SOJA.id);
    await escolher('Safra', SAFRA_DE_2025.id);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByRole('row', { name: /Soja/ })).toBeInTheDocument();
    await expect(corpoEnviadoPara('POST', '/api/plantios')).resolves.toEqual({
      propriedadeId: BOA_VISTA.id,
      culturaId: SOJA.id,
      safraId: SAFRA_DE_2025.id,
    });
  });

  it('mostra o conflito da trinca repetida com o texto que a API mandou', async () => {
    servirCadastro(BASE, {
      ...rotaDosPlantios([plantioDe('pl1', BOA_VISTA, SOJA, SAFRA_DE_2025)]),
      'POST /api/plantios': () => ({
        problema: {
          status: 409,
          title: 'Conflict',
          detail: 'Essa Cultura já foi plantada nessa Propriedade nessa Safra.',
          codigo: 'PLANTIO_DUPLICADO',
        },
      }),
    });

    renderizarNoCadastro(<PlantiosSecao />);
    await screen.findByLabelText('Propriedade');
    await procurarEEscolher('Propriedade', 'boa vista', 'Fazenda Boa Vista · Ana Lima');
    await abrirONovo();

    await escolher('Cultura', SOJA.id);
    await escolher('Safra', SAFRA_DE_2025.id);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Essa Cultura já foi plantada nessa Propriedade nessa Safra.',
    );
  });

  it('exclui um Plantio depois de perguntar', async () => {
    const plantios = [plantioDe('pl1', BOA_VISTA, SOJA, SAFRA_DE_2025)];
    servirCadastro(BASE, {
      ...rotaDosPlantios(plantios),
      'DELETE /api/plantios/:id': () => {
        plantios.length = 0;

        return { semConteudo: true };
      },
    });

    renderizarNoCadastro(<PlantiosSecao />);
    await screen.findByLabelText('Propriedade');
    await procurarEEscolher('Propriedade', 'boa vista', 'Fazenda Boa Vista · Ana Lima');
    await screen.findByRole('row', { name: /Soja/ });

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Soja em 2025' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Nenhum Plantio registrado nesta Propriedade ainda.'),
    ).toBeInTheDocument();
  });

  it('lista os Plantios de uma Propriedade que a busca por identificador não achou', async () => {
    // A Propriedade sumiu entre a chamada dos Plantios e a que a nomearia, e a coluna
    // Plantios da lista dela aponta para cá: o link não pode dar em tela sem saída.
    const deFora = { ...SITIO_DO_MEIO, id: 'propriedade-101' };
    servirCadastro(
      { ...BASE, propriedades: [BOA_VISTA] },
      rotaDosPlantios([plantioDe('pl1', deFora, MILHO, SAFRA_DE_2024)]),
    );

    renderizarNoCadastro(<PlantiosSecao />, `/cadastro/plantios?propriedade=${deFora.id}`);

    const linha = await screen.findByRole('row', { name: /Milho/ });
    expect(within(linha).getByText('2024')).toBeInTheDocument();
    expect(screen.queryByText(/Escolha uma Propriedade acima/)).toBeNull();
  });

  it('não acusa cadastro vazio enquanto a contagem não chega', async () => {
    // Entrando direto no endereço de uma Propriedade, a contagem ainda está em voo. Dizer
    // "registre uma Propriedade antes" aí seria negar a que o próprio endereço aponta.
    servirRotas({
      'GET /api/produtores': () => new Promise(() => undefined),
      'GET /api/propriedades': () => new Promise(() => undefined),
      'GET /api/culturas': () => ({ corpo: [] }),
      'GET /api/safras': () => ({ corpo: [] }),
      ...rotaDosPlantios([plantioDe('pl1', BOA_VISTA, SOJA, SAFRA_DE_2025)]),
    });

    renderizarNoCadastro(<PlantiosSecao />, `/cadastro/plantios?propriedade=${BOA_VISTA.id}`);

    // A lista é buscada pelo identificador, então ela vem; o nome, que vem de outra
    // chamada, é que ainda não veio.
    expect(
      await screen.findByRole('heading', { name: 'Plantios da Propriedade', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.queryByText('Registre uma Propriedade antes: todo Plantio acontece em uma.'),
    ).toBeNull();
  });

  it('sem Propriedade cadastrada, diz o que falta em vez de mostrar lista vazia', async () => {
    servirCadastro({ ...BASE, propriedades: [] }, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);

    expect(
      await screen.findByText('Registre uma Propriedade antes: todo Plantio acontece em uma.'),
    ).toBeInTheDocument();
  });
});
