import { render, screen, within } from '@testing-library/react';
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

    // Sem Propriedade escolhida a seção não lista nada, e é a escolha que a identifica.
    expect(await screen.findByLabelText('Propriedade')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Produtores', level: 2 })).toBeNull();
  });

  it('troca de seção pelo menu do cadastro', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro/produtores');
    await screen.findByRole('heading', { name: 'Produtores', level: 2 });

    await userEvent.click(screen.getByRole('link', { name: 'Culturas e Safras' }));

    expect(await screen.findByRole('heading', { name: 'Culturas', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Safras', level: 2 })).toBeInTheDocument();
  });

  it('busca os catálogos uma vez só, e não uma por seção visitada', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro/produtores');
    await screen.findByRole('heading', { name: 'Produtores', level: 2 });

    await userEvent.click(screen.getByRole('link', { name: 'Culturas e Safras' }));
    await screen.findByRole('heading', { name: 'Culturas', level: 2 });

    expect(screen.getByText('Soja')).toBeInTheDocument();
  });

  it('mostra o rastro de onde se veio quando a lista está recortada', async () => {
    servirCadastro(BASE, {
      'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }),
      'GET /api/produtores/:id': () => ({
        corpo: { ...ANA, propriedades: { itens: [BOA_VISTA], total: 1, pagina: 1, tamanho: 10 } },
      }),
    });

    abrirEm(`/cadastro/propriedades?produtor=${ANA.id}`);

    const rastro = within(await screen.findByRole('navigation', { name: 'Contexto' }));
    expect(rastro.getByRole('link', { name: 'Todos os Produtores' })).toBeInTheDocument();
    expect(rastro.getByText('Ana Lima')).toHaveAttribute('aria-current', 'location');
  });

  it('cala sobre o rastro quando não há recorte nenhum', async () => {
    servirCadastro(BASE, { 'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }) });

    abrirEm('/cadastro/propriedades');
    await screen.findByRole('heading', { name: 'Propriedades', level: 2 });

    expect(screen.queryByRole('navigation', { name: 'Contexto' })).toBeNull();
  });

  it('leva o recorte junto ao trocar de seção pela trilha', async () => {
    servirCadastro(BASE, {
      'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }),
      'GET /api/produtores/:id': () => ({
        corpo: { ...ANA, propriedades: { itens: [BOA_VISTA], total: 1, pagina: 1, tamanho: 10 } },
      }),
    });

    abrirEm(`/cadastro/propriedades?produtor=${ANA.id}`);
    await screen.findByRole('heading', { name: 'Propriedades de Ana Lima', level: 2 });

    const trilha = within(screen.getByRole('navigation', { name: 'Seções do cadastro' }));
    // Sair para os Plantios e voltar não pode obrigar a escolher o Produtor de novo.
    expect(trilha.getByRole('link', { name: 'Plantios' })).toHaveAttribute(
      'href',
      `/cadastro/plantios?produtor=${ANA.id}`,
    );
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

  it('nomeia a Propriedade no rastro mesmo quando ela está além do teto da listagem', async () => {
    // O rastro parava no Produtor e não dizia em qual Propriedade se estava, porque o nome
    // dela saía de uma lista de cem carregada de antemão.
    const distante = { ...BOA_VISTA, id: 'propriedade-901', nome: 'Chácara Céu Azul 19' };
    const enfileiradas = Array.from({ length: 150 }, (_, indice) => ({
      ...BOA_VISTA,
      id: `propriedade-${String(indice)}`,
      nome: `Fazenda ${String(indice)}`,
    }));
    servirCadastro(
      { ...BASE, propriedades: [...enfileiradas, distante] },
      {
        'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }),
        'GET /api/propriedades/:propriedadeId/plantios': () => ({
          corpo: { itens: [], total: 0, pagina: 1, tamanho: 10 },
        }),
      },
    );

    abrirEm(`/cadastro/plantios?produtor=${ANA.id}&propriedade=${distante.id}`);

    const rastro = within(await screen.findByRole('navigation', { name: 'Contexto' }));
    expect(await rastro.findByText('Chácara Céu Azul 19')).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(rastro.getByRole('link', { name: 'Ana Lima' })).toBeInTheDocument();
  });

  it('nomeia o recorte mesmo quando o Produtor está além do teto da listagem', async () => {
    // O dono do recorte é o último de cento e cinquenta. A listagem não o alcança, e é por
    // perguntar por ele pelo identificador que o rastro consegue nomeá-lo.
    const enfileirados = Array.from({ length: 150 }, (_, indice) => ({
      ...ANA,
      id: `produtor-${String(indice)}`,
      nome: `Produtor ${String(indice)}`,
    }));
    servirCadastro(
      { ...BASE, produtores: [...enfileirados, ANA] },
      {
        'GET /api/painel': () => ({ corpo: PAINEL_VAZIO }),
        'GET /api/produtores/:id': () => ({
          corpo: { ...ANA, propriedades: { itens: [BOA_VISTA], total: 1, pagina: 1, tamanho: 10 } },
        }),
      },
    );

    abrirEm(`/cadastro/propriedades?produtor=${ANA.id}`);

    const rastro = within(await screen.findByRole('navigation', { name: 'Contexto' }));
    expect(rastro.getByText('Ana Lima')).toHaveAttribute('aria-current', 'location');
  });
});
