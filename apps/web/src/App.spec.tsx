import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { servirRotas } from './teste/fetch-falso';

const PAINEL_VAZIO = {
  totais: { propriedades: 0, areaTotal: 0 },
  usoDoSolo: { areaAgricultavel: 0, areaDeVegetacao: 0 },
  propriedadesPorEstado: [],
  plantiosPorCultura: [],
};

function abrirEm(endereco: string) {
  servirRotas({
    '/api/painel': () => ({ corpo: PAINEL_VAZIO }),
    '/api/safras': () => ({ corpo: [] }),
  });

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

  it('manda um endereço desconhecido para o painel, em vez de mostrar tela em branco', async () => {
    abrirEm('/nao-existe');

    expect(await screen.findByRole('heading', { name: 'Painel', level: 1 })).toBeInTheDocument();
  });

  it('leva do painel ao cadastro pelo menu', async () => {
    abrirEm('/painel');
    await screen.findByRole('heading', { name: 'Painel', level: 1 });

    await userEvent.click(screen.getByRole('link', { name: 'Cadastro' }));

    expect(screen.getByRole('heading', { name: 'Cadastro', level: 1 })).toBeInTheDocument();
  });
});
