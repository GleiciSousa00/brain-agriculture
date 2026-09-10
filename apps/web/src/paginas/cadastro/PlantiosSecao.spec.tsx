import type { Plantio } from '@cadastro-rural/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
import { corpoEnviadoPara } from '../../teste/fetch-falso';
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

describe('a seção de Plantios', () => {
  it('pede uma Propriedade antes de mostrar Plantio nenhum', async () => {
    servirCadastro(BASE, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);

    expect(
      await screen.findByText('Escolha uma Propriedade para ver e registrar os Plantios dela.'),
    ).toBeInTheDocument();
  });

  it('escolhe a Propriedade pelo nome, que é o que distingue duas na mesma cidade', async () => {
    servirCadastro(BASE, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);

    const campo = await screen.findByLabelText('Propriedade');
    expect(within(campo).getByRole('option', { name: 'Fazenda Boa Vista' })).toBeInTheDocument();
    expect(within(campo).getByRole('option', { name: 'Sítio do Meio' })).toBeInTheDocument();
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

    await escolher('Propriedade', BOA_VISTA.id);

    const linha = await screen.findByRole('row', { name: /Soja/ });
    expect(within(linha).getByText('2025')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Milho/ })).toBeNull();
  });

  it('escolhe Cultura e Safra em listas, sem digitar texto livre', async () => {
    servirCadastro(BASE, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);
    await screen.findByLabelText('Propriedade');
    await escolher('Propriedade', BOA_VISTA.id);

    const cultura = await screen.findByLabelText('Cultura');
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
    await escolher('Propriedade', BOA_VISTA.id);
    await screen.findByLabelText('Cultura');

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
    await escolher('Propriedade', BOA_VISTA.id);
    await screen.findByLabelText('Cultura');

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
    await escolher('Propriedade', BOA_VISTA.id);
    await screen.findByRole('row', { name: /Soja/ });

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Soja em 2025' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Nenhum Plantio registrado nesta Propriedade ainda.'),
    ).toBeInTheDocument();
  });

  it('sem Propriedade cadastrada, diz o que falta em vez de mostrar lista vazia', async () => {
    servirCadastro({ ...BASE, propriedades: [] }, rotaDosPlantios([]));

    renderizarNoCadastro(<PlantiosSecao />);

    expect(
      await screen.findByText('Registre uma Propriedade antes: todo Plantio acontece em uma.'),
    ).toBeInTheDocument();
  });
});
