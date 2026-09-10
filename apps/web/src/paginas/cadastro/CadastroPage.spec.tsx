import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import { servirCadastro } from '../../teste/cadastro-falso';
import { ANA, BOA_VISTA, PAINEL_VAZIO, SOJA } from '../../teste/exemplos';
import { servirRotas } from '../../teste/fetch-falso';

const BASE = { produtores: [ANA], propriedades: [BOA_VISTA], culturas: [SOJA], safras: [] };

/** A tela inteira, no endereço pedido, para que as sub-rotas sejam as de verdade. */
function abrirEm(endereco: string) {
  return render(
    <MemoryRouter initialEntries={[endereco]}>
      <App />
    </MemoryRouter>,
  );
}

describe('a tela de cadastro', () => {
  it('manda quem entra em /cadastro para a seção de Produtores', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro');

    expect(await screen.findByRole('heading', { name: 'Produtores', level: 2 })).toBeInTheDocument();
  });

  it('abre a seção pedida direto pelo endereço dela', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro/plantios');

    expect(await screen.findByRole('heading', { name: 'Plantios', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Produtores', level: 2 })).toBeNull();
  });

  it('troca de seção pelo menu do cadastro', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro/produtores');
    await screen.findByRole('heading', { name: 'Produtores', level: 2 });

    await userEvent.click(screen.getByRole('link', { name: 'Culturas e Safras' }));

    expect(
      await screen.findByRole('heading', { name: 'Culturas e Safras', level: 2 }),
    ).toBeInTheDocument();
  });

  it('busca os catálogos uma vez só, e não uma por seção visitada', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro/produtores');
    await screen.findByRole('heading', { name: 'Produtores', level: 2 });

    await userEvent.click(screen.getByRole('link', { name: 'Culturas e Safras' }));
    await screen.findByRole('heading', { name: 'Culturas e Safras', level: 2 });

    // O provedor fica de pé por cima das quatro seções, então trocar de seção não o remonta.
    expect(screen.getByText('Soja')).toBeInTheDocument();
  });

  it('avisa quando os catálogos não vêm, sem deixar a tela em branco', async () => {
    servirRotas({
      'GET /api/produtores': () => ({
        problema: {
          status: 500,
          title: 'Internal Server Error',
          detail: 'O banco não respondeu a tempo.',
        },
      }),
      'GET /api/propriedades': () => ({ corpo: { itens: [], total: 0, pagina: 1, tamanho: 100 } }),
      'GET /api/culturas': () => ({ corpo: [] }),
      'GET /api/safras': () => ({ corpo: [] }),
    });

    abrirEm('/cadastro/propriedades');

    expect(await screen.findByRole('alert')).toHaveTextContent('O banco não respondeu a tempo.');
    expect(screen.getByRole('heading', { name: 'Propriedades', level: 2 })).toBeInTheDocument();
  });
});
