import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { chamadasPara, servirRotas } from '../../teste/fetch-falso';
import { PainelPage } from './PainelPage';

const SAFRA_DE_2025 = { id: 'safra-2025', ano: 2025 };
const SAFRA_DE_2024 = { id: 'safra-2024', ano: 2024 };

const PAINEL_COM_DADOS = {
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

const PAINEL_VAZIO = {
  totais: { propriedades: 0, areaTotal: 0 },
  usoDoSolo: { areaAgricultavel: 0, areaDeVegetacao: 0 },
  propriedadesPorEstado: [],
  plantiosPorCultura: [],
};

/** O cartão de um gráfico, achado pelo próprio título. */
function cartaoDe(titulo: string): HTMLElement {
  return screen.getByRole('region', { name: titulo });
}

describe('a tela do painel', () => {
  it('mostra a contagem de Propriedades e a soma de hectares', async () => {
    servirRotas({
      '/api/painel': () => ({ corpo: PAINEL_COM_DADOS }),
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('1.234,5 ha')).toBeInTheDocument();
  });

  it('desenha as três distribuições, cada uma com seus números', async () => {
    servirRotas({
      '/api/painel': () => ({ corpo: PAINEL_COM_DADOS }),
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);

    const porEstado = within(await screen.findByRole('region', { name: 'Propriedades por estado' }));
    expect(porEstado.getByText('MG')).toBeInTheDocument();
    expect(porEstado.getByText('3 (75%)')).toBeInTheDocument();

    const porCultura = within(cartaoDe('Plantios por Cultura'));
    expect(porCultura.getByText('Soja')).toBeInTheDocument();
    expect(porCultura.getByText('4 (80%)')).toBeInTheDocument();

    const usoDoSolo = within(cartaoDe('Uso do solo'));
    expect(usoDoSolo.getByText('Área agricultável')).toBeInTheDocument();
    expect(usoDoSolo.getByText('800 ha (64,8%)')).toBeInTheDocument();
  });

  it('busca o painel uma vez só, e não um pedido por gráfico', async () => {
    servirRotas({
      '/api/painel': () => ({ corpo: PAINEL_COM_DADOS }),
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);
    await screen.findByRole('region', { name: 'Uso do solo' });

    expect(chamadasPara('/api/painel')).toBe(1);
  });

  it('põe o controle de Safra dentro do cartão da Cultura, e não no topo da tela', async () => {
    servirRotas({
      '/api/painel': () => ({ corpo: PAINEL_COM_DADOS }),
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025, SAFRA_DE_2024] }),
    });

    render(<PainelPage />);
    await screen.findByRole('region', { name: 'Plantios por Cultura' });

    expect(within(cartaoDe('Plantios por Cultura')).getByLabelText('Safra')).toBeInTheDocument();
    expect(within(cartaoDe('Propriedades por estado')).queryByLabelText('Safra')).toBeNull();
    expect(within(cartaoDe('Uso do solo')).queryByLabelText('Safra')).toBeNull();
  });

  it('trocar a Safra mexe só no gráfico de Cultura', async () => {
    // O recorte devolve totais e distribuições diferentes de propósito, o que a API não
    // faz: é assim que se prova que a tela aproveita apenas a fatia da Cultura.
    servirRotas({
      '/api/painel': (url) =>
        url.searchParams.get('safraId') === SAFRA_DE_2025.id
          ? {
              corpo: {
                totais: { propriedades: 99, areaTotal: 1 },
                usoDoSolo: { areaAgricultavel: 1, areaDeVegetacao: 1 },
                propriedadesPorEstado: [{ estado: 'BA', propriedades: 99 }],
                plantiosPorCultura: [{ culturaId: 'c2', cultura: 'Milho', plantios: 7 }],
              },
            }
          : { corpo: PAINEL_COM_DADOS },
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025, SAFRA_DE_2024] }),
    });

    render(<PainelPage />);
    await screen.findByRole('option', { name: '2025' });

    await userEvent.selectOptions(screen.getByLabelText('Safra'), SAFRA_DE_2025.id);

    const porCultura = within(cartaoDe('Plantios por Cultura'));
    expect(await porCultura.findByText('Milho')).toBeInTheDocument();
    expect(porCultura.queryByText('Soja')).toBeNull();

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('1.234,5 ha')).toBeInTheDocument();
    expect(within(cartaoDe('Propriedades por estado')).getByText('MG')).toBeInTheDocument();
    expect(within(cartaoDe('Uso do solo')).getByText('800 ha (64,8%)')).toBeInTheDocument();
  });

  it('com a base vazia, explica cada gráfico em vez de deixá-lo em branco', async () => {
    servirRotas({
      '/api/painel': () => ({ corpo: PAINEL_VAZIO }),
      '/api/safras': () => ({ corpo: [] }),
    });

    render(<PainelPage />);

    expect(await screen.findByText('Nenhuma Propriedade cadastrada ainda.')).toBeInTheDocument();
    expect(screen.getByText('Nenhum Plantio registrado ainda.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma área informada ainda.')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0 ha')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('com a base vazia, o recorte por Safra diz que a Safra é que está vazia', async () => {
    servirRotas({
      '/api/painel': () => ({ corpo: PAINEL_VAZIO }),
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);
    await screen.findByRole('option', { name: '2025' });

    await userEvent.selectOptions(screen.getByLabelText('Safra'), SAFRA_DE_2025.id);

    expect(await screen.findByText('Nenhum Plantio registrado nesta Safra.')).toBeInTheDocument();
  });

  it('mostra o texto que a API mandou quando a primeira carga falha', async () => {
    servirRotas({
      '/api/painel': () => ({
        problema: {
          status: 500,
          title: 'Internal Server Error',
          detail: 'O banco não respondeu a tempo.',
        },
      }),
      '/api/safras': () => ({ corpo: [] }),
    });

    render(<PainelPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('O banco não respondeu a tempo.');
  });

  it('falha de recorte não derruba a tela: o aviso fica no cartão da Cultura', async () => {
    servirRotas({
      '/api/painel': (url) =>
        url.searchParams.get('safraId') === null
          ? { corpo: PAINEL_COM_DADOS }
          : {
              problema: {
                status: 400,
                title: 'Bad Request',
                detail: 'O filtro de Safra não é um identificador válido.',
              },
            },
      '/api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);
    await screen.findByRole('option', { name: '2025' });

    await userEvent.selectOptions(screen.getByLabelText('Safra'), SAFRA_DE_2025.id);

    const porCultura = within(cartaoDe('Plantios por Cultura'));
    expect(await porCultura.findByRole('status')).toHaveTextContent(
      'O filtro de Safra não é um identificador válido.',
    );
    expect(screen.getByText('1.234,5 ha')).toBeInTheDocument();
  });
});
