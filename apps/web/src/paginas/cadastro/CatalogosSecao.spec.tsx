import type { Cultura, Safra } from '@cadastro-rural/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarNoCadastro, servirCadastro } from '../../teste/cadastro-falso';
import { MILHO, SAFRA_DE_2024, SAFRA_DE_2025, SOJA } from '../../teste/exemplos';
import { corpoEnviadoPara } from '../../teste/fetch-falso';
import { CatalogosSecao } from './CatalogosSecao';

/** O cartão de um catálogo, achado pelo próprio título. */
function cartaoDe(titulo: string): HTMLElement {
  return screen.getByRole('region', { name: titulo });
}

/** Os formulários nascem fechados: quem vai registrar pede por eles antes. */
async function abrir(botao: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: botao }));
}

describe('a seção de Culturas e Safras', () => {
  it('mostra os dois catálogos, cada um no seu cartão', async () => {
    servirCadastro({ culturas: [MILHO, SOJA], safras: [SAFRA_DE_2025, SAFRA_DE_2024] });

    renderizarNoCadastro(<CatalogosSecao />);

    expect(await screen.findByText('Milho')).toBeInTheDocument();
    expect(within(cartaoDe('Culturas')).getByText('Soja')).toBeInTheDocument();
    expect(within(cartaoDe('Safras')).getByText('2025')).toBeInTheDocument();
    expect(within(cartaoDe('Safras')).getByText('2024')).toBeInTheDocument();
    expect(within(cartaoDe('Culturas')).getByText('2 culturas')).toBeInTheDocument();
    expect(within(cartaoDe('Safras')).getByText('2 safras')).toBeInTheDocument();
  });

  it('acrescenta uma espécie e ela passa a aparecer no catálogo', async () => {
    const culturas: Cultura[] = [];
    servirCadastro(
      { culturas },
      {
        'POST /api/culturas': ({ corpo }) => {
          const pedido = corpo as { nome: string };
          const criada = { id: 'nova', nome: pedido.nome };
          culturas.push(criada);

          return { corpo: criada };
        },
      },
    );

    renderizarNoCadastro(<CatalogosSecao />);
    await screen.findByText('Nenhuma Cultura no catálogo ainda.');
    await abrir('Nova Cultura');

    await userEvent.type(screen.getByLabelText('Nome da Cultura'), 'Café');
    await userEvent.click(screen.getByRole('button', { name: 'Acrescentar' }));

    expect(await screen.findByText('Café')).toBeInTheDocument();
    await expect(corpoEnviadoPara('POST', '/api/culturas')).resolves.toEqual({ nome: 'Café' });
  });

  it('registra uma Safra e ela passa a aparecer no catálogo', async () => {
    const safras: Safra[] = [];
    servirCadastro(
      { safras },
      {
        'POST /api/safras': ({ corpo }) => {
          const pedido = corpo as { ano: number };
          const criada = { id: 'nova', ano: pedido.ano };
          safras.push(criada);

          return { corpo: criada };
        },
      },
    );

    renderizarNoCadastro(<CatalogosSecao />);
    await screen.findByText('Nenhuma Safra registrada ainda.');
    await abrir('Nova Safra');

    await userEvent.type(screen.getByLabelText('Ano da Safra'), '2026');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('2026')).toBeInTheDocument();
    // O ano vai como número, e não como o texto que o campo devolve.
    await expect(corpoEnviadoPara('POST', '/api/safras')).resolves.toEqual({ ano: 2026 });
  });

  it('mostra a recusa da Cultura repetida com o texto que a API mandou', async () => {
    servirCadastro(
      { culturas: [SOJA] },
      {
        'POST /api/culturas': () => ({
          problema: {
            status: 409,
            title: 'Conflict',
            detail: 'Já existe uma Cultura com esse nome no catálogo.',
            codigo: 'CULTURA_DUPLICADA',
          },
        }),
      },
    );

    renderizarNoCadastro(<CatalogosSecao />);
    await screen.findByText('Soja');
    await abrir('Nova Cultura');

    await userEvent.type(screen.getByLabelText('Nome da Cultura'), 'Soja');
    await userEvent.click(screen.getByRole('button', { name: 'Acrescentar' }));

    expect(await within(cartaoDe('Culturas')).findByRole('alert')).toHaveTextContent(
      'Já existe uma Cultura com esse nome no catálogo.',
    );
  });
});
