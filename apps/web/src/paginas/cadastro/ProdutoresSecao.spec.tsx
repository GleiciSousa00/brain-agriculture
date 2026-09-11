import type { Produtor } from '@cadastro-rural/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { paginar, renderizarNoCadastro, servirCadastro } from '../../teste/cadastro-falso';
import { AGRO_BETO, ANA, BOA_VISTA, SITIO_DO_MEIO } from '../../teste/exemplos';
import { corpoEnviadoPara, servirRotas } from '../../teste/fetch-falso';
import { ProdutoresSecao } from './ProdutoresSecao';

/** A linha da tabela em que o nome dado aparece. */
function linhaDe(nome: string): HTMLElement {
  return screen.getByRole('row', { name: new RegExp(nome) });
}

async function preencher(rotulo: string, texto: string): Promise<void> {
  const campo = screen.getByLabelText(rotulo);
  await userEvent.clear(campo);
  await userEvent.type(campo, texto);
}

/** O formulário nasce fechado: quem vai registrar pede por ele antes. */
async function abrirONovo(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Novo Produtor' }));
}

describe('a seção de Produtores', () => {
  it('lista os Produtores com o Documento como a API o mandou, já mascarado', async () => {
    servirCadastro({ produtores: [ANA, AGRO_BETO] });

    renderizarNoCadastro(<ProdutoresSecao />);

    expect(await screen.findByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('***.456.789-00')).toBeInTheDocument();
    expect(screen.getByText('**.***.678/0001-90')).toBeInTheDocument();
  });

  it('diz que a base está vazia em vez de mostrar tabela sem linha', async () => {
    servirCadastro({ produtores: [] });

    renderizarNoCadastro(<ProdutoresSecao />);

    expect(await screen.findByText('Nenhum Produtor cadastrado ainda.')).toBeInTheDocument();
  });

  it('registra um Produtor e mostra o que a API devolveu', async () => {
    const produtores: Produtor[] = [];
    servirCadastro(
      { produtores },
      {
        'POST /api/produtores': ({ corpo }) => {
          const pedido = corpo as { nome: string };
          const criado = { ...ANA, nome: pedido.nome };
          produtores.push(criado);

          return { corpo: criado };
        },
      },
    );

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Nenhum Produtor cadastrado ainda.');
    await abrirONovo();

    await preencher('Nome', 'Ana Lima');
    await preencher('Documento', '123.456.789-00');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('Ana Lima')).toBeInTheDocument();
    // O Documento aparece mascarado porque é assim que a API o devolve, e a tela não o
    // formata de novo: o que foi digitado tinha máscara diferente.
    expect(screen.getByText('***.456.789-00')).toBeInTheDocument();
  });

  it('manda nome e Documento como foram digitados', async () => {
    servirCadastro({ produtores: [] }, { 'POST /api/produtores': () => ({ corpo: ANA }) });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Nenhum Produtor cadastrado ainda.');
    await abrirONovo();

    await preencher('Nome', 'Ana Lima');
    await preencher('Documento', '12345678900');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    // O formulário só se fecha depois que a escrita passou.
    await waitFor(() => {
      expect(screen.queryByLabelText('Nome')).toBeNull();
    });
    await expect(corpoEnviadoPara('POST', '/api/produtores')).resolves.toEqual({
      nome: 'Ana Lima',
      documento: '12345678900',
    });
  });

  it('mostra a recusa do Documento com o texto que a API mandou', async () => {
    servirCadastro(
      { produtores: [] },
      {
        'POST /api/produtores': () => ({
          problema: {
            status: 400,
            title: 'Bad Request',
            detail: 'O Documento informado não é um CPF nem um CNPJ válido.',
            codigo: 'DOCUMENTO_INVALIDO',
          },
        }),
      },
    );

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Nenhum Produtor cadastrado ainda.');
    await abrirONovo();

    await preencher('Nome', 'Ana Lima');
    await preencher('Documento', '111');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O Documento informado não é um CPF nem um CNPJ válido.',
    );
  });

  it('corrige o nome sem oferecer o Documento para edição', async () => {
    const produtores = [{ ...ANA }];
    servirCadastro(
      { produtores },
      {
        'PATCH /api/produtores/:id': ({ corpo }) => {
          const pedido = corpo as { nome: string };
          produtores[0] = { ...ANA, nome: pedido.nome };

          return { corpo: produtores[0] };
        },
      },
    );

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Editar Ana Lima' }));
    expect(screen.queryByLabelText('Documento')).toBeNull();

    await preencher('Nome', 'Ana Maria Lima');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Ana Maria Lima')).toBeInTheDocument();
  });

  it('pergunta antes de excluir, e avisa que as Propriedades vão junto', async () => {
    const produtores = [{ ...ANA }];
    servirCadastro(
      { produtores },
      {
        'DELETE /api/produtores/:id': () => {
          produtores.length = 0;

          return { semConteudo: true };
        },
      },
    );

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Ana Lima' }));
    expect(
      screen.getByText('Excluir Ana Lima? As Propriedades e os Plantios desse Produtor vão junto.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Nenhum Produtor cadastrado ainda.')).toBeInTheDocument();
  });

  it('desiste da exclusão quando a pergunta é cancelada', async () => {
    servirCadastro({ produtores: [ANA] });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Ana Lima' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir Ana Lima' })).toBeInTheDocument();
  });

  it('mostra dez por página e diz quantas páginas existem', async () => {
    const muitos = Array.from({ length: 23 }, (_, indice) => ({
      ...ANA,
      id: `produtor-${indice}`,
      nome: `Produtor ${String(indice).padStart(2, '0')}`,
    }));
    servirCadastro({ produtores: muitos });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Produtor 00');

    expect(screen.getByText('página 1 de 3')).toBeInTheDocument();
    expect(screen.queryByText('Produtor 10')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByText('Produtor 10')).toBeInTheDocument();
    expect(screen.queryByText('Produtor 00')).toBeNull();
    expect(screen.getByText('página 2 de 3')).toBeInTheDocument();
  });

  it('mostra a recusa da exclusão dentro da linha, sem derrubar a tabela', async () => {
    servirCadastro(
      { produtores: [ANA, AGRO_BETO] },
      {
        'DELETE /api/produtores/:id': () => ({
          problema: {
            status: 404,
            title: 'Not Found',
            detail: 'Não existe Produtor com esse identificador.',
          },
        }),
      },
    );

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Ana Lima' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não existe Produtor com esse identificador.',
    );
    expect(within(linhaDe('Agro Beto')).getByText('Agro Beto')).toBeInTheDocument();
  });
  it('cancelar a edição leva embora a recusa que o formulário tinha recebido', async () => {
    servirCadastro(
      { produtores: [ANA] },
      {
        'PATCH /api/produtores/:id': () => ({
          problema: { status: 400, title: 'Bad Request', detail: 'O nome não pode ser vazio.' },
        }),
      },
    );

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Editar Ana Lima' }));
    await preencher('Nome', 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    // A recusa era do que se mandou. Deixá-la sobre o formulário vazio de novo Produtor
    // seria acusar de recusado o que ninguém mandou.
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('conta quantos Produtores existem, e não quantos couberam na página', async () => {
    const muitos = Array.from({ length: 23 }, (_, indice) => ({
      ...ANA,
      id: `produtor-${String(indice)}`,
      nome: `Produtor ${String(indice).padStart(2, '0')}`,
    }));
    servirCadastro({ produtores: muitos });

    renderizarNoCadastro(<ProdutoresSecao />);

    expect(await screen.findByText('23 registros')).toBeInTheDocument();
  });

  it('leva de cada Produtor às Propriedades dele, dizendo quantas são', async () => {
    servirCadastro({ produtores: [ANA], propriedades: [BOA_VISTA, SITIO_DO_MEIO] });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    const descida = screen.getByRole('link', { name: 'Ver as Propriedades de Ana Lima' });
    expect(descida).toHaveTextContent('2 propriedades');
    expect(descida).toHaveAttribute('href', `/cadastro/propriedades?produtor=${ANA.id}`);
  });

  it('oferece registrar a primeira ao Produtor que ainda não tem Propriedade', async () => {
    servirCadastro({ produtores: [ANA], propriedades: [] });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    const descida = screen.getByRole('link', {
      name: 'Registrar a primeira Propriedade de Ana Lima',
    });
    expect(descida).toHaveTextContent('Registrar a primeira');
    // O formulário do outro lado já abre, porque quem clicou pediu para registrar.
    expect(descida).toHaveAttribute('href', `/cadastro/propriedades?produtor=${ANA.id}&novo=1`);
  });

  it('não oferece registrar a primeira antes de o catálogo dizer quantas existem', async () => {
    // A tabela vem de uma chamada e o catálogo de outra. Segurando o catálogo, a tabela
    // pinta primeiro: contar aí seria contar zero e oferecer o que já existe.
    servirRotas({
      'GET /api/produtores': ({ url }) => ({ corpo: paginar([ANA], url) }),
      'GET /api/propriedades': () => new Promise(() => undefined),
      'GET /api/culturas': () => ({ corpo: [] }),
      'GET /api/safras': () => ({ corpo: [] }),
    });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    expect(screen.queryByText('Registrar a primeira')).toBeNull();
    expect(screen.getByRole('link', { name: 'Ver as Propriedades de Ana Lima' })).toBeInTheDocument();
  });

  it('tira a tabela da tela quando a listagem falha, em vez de deixar linha velha', async () => {
    const produtores = [{ ...ANA }];
    let listagemQuebrada = false;
    servirRotas({
      'GET /api/produtores': ({ url }) =>
        listagemQuebrada
          ? { problema: { status: 500, title: 'Internal Server Error', detail: 'O banco caiu.' } }
          : { corpo: paginar(produtores, url) },
      'GET /api/propriedades': ({ url }) => ({ corpo: paginar([], url) }),
      'GET /api/culturas': () => ({ corpo: [] }),
      'GET /api/safras': () => ({ corpo: [] }),
      'DELETE /api/produtores/:id': () => {
        produtores.length = 0;
        listagemQuebrada = true;

        return { semConteudo: true };
      },
    });

    renderizarNoCadastro(<ProdutoresSecao />);
    await screen.findByText('Ana Lima');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Ana Lima' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O banco caiu.');
    expect(screen.queryByRole('table')).toBeNull();
    // E nem por isso a tela diz que a base está vazia, que seria a outra mentira.
    expect(screen.queryByText('Nenhum Produtor cadastrado ainda.')).toBeNull();
  });
});
