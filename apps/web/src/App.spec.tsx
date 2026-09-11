import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { servirCadastro } from './teste/cadastro-falso';
import { PAINEL_VAZIO } from './teste/exemplos';

function abrirEm(endereco: string) {
  servirCadastro({}, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

  return render(
    <MemoryRouter initialEntries={[endereco]}>
      <App />
    </MemoryRouter>,
  );
}

describe('a navegação', () => {
  it('abre o painel no endereço do painel', async () => {
    abrirEm('/painel');

    expect(await screen.findByRole('heading', { name: 'Painel', level: 1 })).toBeInTheDocument();
  });

  it('manda a raiz para o painel, que é a tela de entrada', async () => {
    abrirEm('/');

    expect(await screen.findByRole('heading', { name: 'Painel', level: 1 })).toBeInTheDocument();
  });

  it('diz que o endereço desconhecido não existe, em vez de mandar calado para o painel', async () => {
    abrirEm('/nao-existe');

    expect(
      await screen.findByRole('heading', { name: 'Esta página não existe.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o Painel' })).toBeInTheDocument();
  });

  it('nomeia a aba pela tela aberta', async () => {
    abrirEm('/painel');
    await screen.findByRole('heading', { name: 'Painel', level: 1 });

    expect(document.title).toBe('Painel · Cadastro Rural');

    await userEvent.click(screen.getByRole('link', { name: 'Cadastro' }));

    expect(document.title).toBe('Produtores · Cadastro Rural');
  });

  it('leva do painel ao cadastro pelo menu', async () => {
    abrirEm('/painel');
    await screen.findByRole('heading', { name: 'Painel', level: 1 });

    await userEvent.click(screen.getByRole('link', { name: 'Cadastro' }));

    expect(screen.getByRole('heading', { name: 'Cadastro', level: 1 })).toBeInTheDocument();
  });
});
