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

/** O número que um dos cartões do alto mostra, achado pelo que ele diz contar. */
function total(rotulo: string): string {
  const valor = screen.getByText(rotulo).parentElement?.querySelector('dd');

  return valor?.textContent ?? '';
}

/**
 * A linha da legenda de uma fatia, achada pelo rótulo dela.
 *
 * O número e a participação moram em elementos diferentes dentro dela, então quem se
 * afirma é a linha inteira.
 */
function fatia(cartao: HTMLElement, nome: string): HTMLElement {
  const linha = within(cartao).getByText(nome).closest('li');

  if (linha === null) {
    throw new Error(`A fatia "${nome}" não está numa linha de legenda.`);
  }

  return linha;
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

    expect(await screen.findByText('Propriedades cadastradas')).toBeInTheDocument();
    expect(total('Propriedades cadastradas')).toBe('4');
    expect(total('Área total')).toBe('1.234,5 ha');
  });

  it('desenha as três distribuições, cada uma com seus números', async () => {
    painelEstavel();

    render(<PainelPage />);

    const porEstado = await screen.findByRole('region', { name: 'Propriedades por estado' });
    expect(fatia(porEstado, 'MG')).toHaveTextContent('3 · 75%');

    expect(fatia(cartaoDe('Plantios por Cultura'), 'Soja')).toHaveTextContent('4 · 80%');
    expect(fatia(cartaoDe('Uso do solo'), 'Área agricultável')).toHaveTextContent('800 ha · 64,8%');
  });

  it('mede o Uso do Solo contra a Área Total, e não contra a soma das duas fatias', async () => {
    // A repartição pode não cobrir a Área Total inteira: aqui sobram 200 dos 1.000.
    servirRotas({
      'GET /api/painel': () => ({
        corpo: {
          ...PAINEL_COM_DADOS,
          totais: { propriedades: 4, areaTotal: 1000 },
          usoDoSolo: { areaAgricultavel: 600, areaDeVegetacao: 200 },
        },
      }),
      'GET /api/safras': () => ({ corpo: [] }),
    });

    render(<PainelPage />);
    await screen.findByRole('region', { name: 'Uso do solo' });

    // Somadas dariam cem por cento, e os 200 hectares que a repartição não cobre sumiriam.
    expect(fatia(cartaoDe('Uso do solo'), 'Área agricultável')).toHaveTextContent('600 ha · 60%');
    expect(fatia(cartaoDe('Uso do solo'), 'Área de vegetação')).toHaveTextContent('200 ha · 20%');
  });

  it('busca o painel uma vez só, e não um pedido por gráfico', async () => {
    painelEstavel();

    render(<PainelPage />);
    await screen.findByRole('region', { name: 'Uso do solo' });

    expect(chamadasPara('/api/painel')).toBe(1);
    // A outra é o catálogo de Safras, que alimenta o controle e não sai do painel.
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
    // O recorte devolve totais e distribuições diferentes de propósito, o que a API não
    // faz: é assim que se prova que a tela aproveita apenas a fatia da Cultura.
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

    expect(total('Propriedades cadastradas')).toBe('4');
    expect(total('Área total')).toBe('1.234,5 ha');
    expect(within(cartaoDe('Propriedades por estado')).getByText('MG')).toBeInTheDocument();
    expect(fatia(cartaoDe('Uso do solo'), 'Área agricultável')).toHaveTextContent('800 ha · 64,8%');
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
    expect(total('Propriedades cadastradas')).toBe('0');
    expect(total('Área total')).toBe('0 ha');
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
      expect(total('Área total')).toBe('1.234,5 ha');
    });

    it('tira da tela a distribuição da Safra anterior, em vez de rotulá-la com a nova', async () => {
      painelQueRecusaORecorte();

      await escolher2025();

      const porCultura = within(cartaoDe('Plantios por Cultura'));
      await porCultura.findByRole('status');
      expect(porCultura.queryByText('Soja')).toBeNull();
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
