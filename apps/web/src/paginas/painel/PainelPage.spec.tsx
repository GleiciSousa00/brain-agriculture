import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  PAINEL_COM_DADOS,
  PAINEL_VAZIO,
  SAFRA_DE_2024,
  SAFRA_DE_2025,
} from '../../teste/exemplos';
import { chamadasPara, servirRotas, totalDeChamadas } from '../../teste/fetch-falso';
import { PainelPage } from './PainelPage';

/** O cartão de um gráfico, achado pelo próprio título. */
function cartaoDe(titulo: string): HTMLElement {
  return screen.getByRole('region', { name: titulo });
}

/** O caso comum: o painel responde sempre a mesma coisa, e há duas Safras no catálogo. */
function painelEstavel(): void {
  servirRotas({
    'GET /api/painel': () => ({ corpo: PAINEL_COM_DADOS }),
    'GET /api/safras': () => ({ corpo: [SAFRA_DE_2025, SAFRA_DE_2024] }),
  });
}

describe('a tela do painel', () => {
  it('mostra a contagem de Propriedades e a soma de hectares', async () => {
    painelEstavel();

    render(<PainelPage />);

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('1.234,5 ha')).toBeInTheDocument();
  });

  it('desenha as três distribuições, cada uma com seus números', async () => {
    painelEstavel();

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
    painelEstavel();

    render(<PainelPage />);
    await screen.findByRole('region', { name: 'Uso do solo' });

    expect(chamadasPara('/api/painel')).toBe(1);
    expect(totalDeChamadas()).toBe(2);
  });

  it('põe o controle de Safra dentro do cartão da Cultura, e não no topo da tela', async () => {
    painelEstavel();

    render(<PainelPage />);
    await screen.findByRole('region', { name: 'Plantios por Cultura' });

    expect(within(cartaoDe('Plantios por Cultura')).getByLabelText('Safra')).toBeInTheDocument();
    expect(within(cartaoDe('Propriedades por estado')).queryByLabelText('Safra')).toBeNull();
    expect(within(cartaoDe('Uso do solo')).queryByLabelText('Safra')).toBeNull();
  });

  it('trocar a Safra mexe só no gráfico de Cultura', async () => {
    servirRotas({
      'GET /api/painel': ({ url }) =>
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
      'GET /api/safras': () => ({ corpo: [SAFRA_DE_2025, SAFRA_DE_2024] }),
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
      'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }),
      'GET /api/safras': () => ({ corpo: [] }),
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
      'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }),
      'GET /api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);
    await screen.findByRole('option', { name: '2025' });

    await userEvent.selectOptions(screen.getByLabelText('Safra'), SAFRA_DE_2025.id);

    expect(await screen.findByText('Nenhum Plantio registrado nesta Safra.')).toBeInTheDocument();
  });

  it('mostra o texto que a API mandou quando a primeira carga falha', async () => {
    servirRotas({
      'GET /api/painel': () => ({
        problema: {
          status: 500,
          title: 'Internal Server Error',
          detail: 'O banco não respondeu a tempo.',
        },
      }),
      'GET /api/safras': () => ({ corpo: [] }),
    });

    render(<PainelPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('O banco não respondeu a tempo.');
  });

  describe('quando o recorte por Safra falha', () => {
    function painelQueRecusaORecorte(): void {
      servirRotas({
        'GET /api/painel': ({ url }) =>
          url.searchParams.get('safraId') === null
            ? { corpo: PAINEL_COM_DADOS }
            : {
                problema: {
                  status: 400,
                  title: 'Bad Request',
                  detail: 'O filtro de Safra não é um identificador válido.',
                },
              },
        'GET /api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
      });
    }

    async function escolher2025(): Promise<void> {
      render(<PainelPage />);
      await screen.findByRole('option', { name: '2025' });
      await userEvent.selectOptions(screen.getByLabelText('Safra'), SAFRA_DE_2025.id);
    }

    it('avisa dentro do cartão da Cultura, sem derrubar o resto da tela', async () => {
      painelQueRecusaORecorte();

      await escolher2025();

      const porCultura = within(cartaoDe('Plantios por Cultura'));
      expect(await porCultura.findByRole('status')).toHaveTextContent(
        'O filtro de Safra não é um identificador válido.',
      );
      expect(screen.getByText('1.234,5 ha')).toBeInTheDocument();
    });

    it('tira da tela a distribuição da Safra anterior, em vez de rotulá-la com a nova', async () => {
      painelQueRecusaORecorte();

      await escolher2025();

      const porCultura = within(cartaoDe('Plantios por Cultura'));
      await porCultura.findByRole('status');
      expect(porCultura.queryByText('Soja')).toBeNull();
      expect(porCultura.queryByText('4 (80%)')).toBeNull();
      expect(porCultura.getByText('Sem distribuição para mostrar.')).toBeInTheDocument();
    });
  });

  it('enquanto o recorte não volta, tira o número anterior da tela', async () => {
    let liberarORecorte = () => {};
    const recorteLiberado = new Promise<void>((resolva) => {
      liberarORecorte = resolva;
    });

    servirRotas({
      'GET /api/painel': ({ url }) =>
        url.searchParams.get('safraId') === null
          ? { corpo: PAINEL_COM_DADOS }
          : recorteLiberado.then(() => ({
              corpo: {
                ...PAINEL_COM_DADOS,
                plantiosPorCultura: [{ culturaId: 'c2', cultura: 'Milho', plantios: 7 }],
              },
            })),
      'GET /api/safras': () => ({ corpo: [SAFRA_DE_2025] }),
    });

    render(<PainelPage />);
    await screen.findByRole('option', { name: '2025' });
    await userEvent.selectOptions(screen.getByLabelText('Safra'), SAFRA_DE_2025.id);

    const porCultura = within(cartaoDe('Plantios por Cultura'));
    expect(await porCultura.findByText('Recortando pela Safra…')).toBeInTheDocument();
    expect(porCultura.queryByText('Soja')).toBeNull();

    liberarORecorte();

    expect(await porCultura.findByText('Milho')).toBeInTheDocument();
  });
});
