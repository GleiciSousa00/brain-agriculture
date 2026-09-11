import type { Propriedade } from '@cadastro-rural/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { procurarEEscolher } from '../../teste/busca-falsa';
import { renderizarNoCadastro, servirCadastro } from '../../teste/cadastro-falso';
import { AGRO_BETO, ANA, BOA_VISTA, SITIO_DO_MEIO } from '../../teste/exemplos';
import { corpoEnviadoPara } from '../../teste/fetch-falso';
import { PropriedadesSecao } from './PropriedadesSecao';

async function preencher(rotulo: string, texto: string): Promise<void> {
  const campo = screen.getByLabelText(rotulo);
  await userEvent.clear(campo);
  await userEvent.type(campo, texto);
}

/** O formulário nasce fechado: quem vai registrar pede por ele antes. */
async function abrirANova(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Nova Propriedade' }));
}

async function preencherAPropriedade(): Promise<void> {
  await abrirANova();
  await procurarEEscolher('Produtor', 'ana', 'Ana Lima');
  await preencher('Nome', 'Fazenda Boa Vista');
  await preencher('Cidade', 'Uberaba');
  await userEvent.selectOptions(screen.getByLabelText('Estado'), 'MG');
  await preencher('Total', '100');
  await preencher('Agricultável', '60');
  await preencher('Vegetação', '30');
}

describe('a seção de Propriedades', () => {
  it('lista as Propriedades com o nome do Produtor de cada uma', async () => {
    servirCadastro({
      produtores: [ANA, AGRO_BETO],
      propriedades: [BOA_VISTA, SITIO_DO_MEIO],
    });

    renderizarNoCadastro(<PropriedadesSecao />);

    const linha = await screen.findByRole('row', { name: /Fazenda Boa Vista/ });
    expect(within(linha).getByText('Ana Lima')).toBeInTheDocument();
    expect(within(linha).getByText('Uberaba/MG')).toBeInTheDocument();
    expect(within(linha).getByText('100 ha')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Sítio do Meio/ })).toBeInTheDocument();
  });

  it('mostra um travessão quando o Produtor da Propriedade ficou fora do catálogo', async () => {
    servirCadastro({
      produtores: [AGRO_BETO],
      propriedades: [BOA_VISTA],
    });

    renderizarNoCadastro(<PropriedadesSecao />);

    const linha = await screen.findByRole('row', { name: /Fazenda Boa Vista/ });
    expect(within(linha).getByText('—')).toBeInTheDocument();
    expect(within(linha).queryByText('Ana Lima')).toBeNull();
  });

  it('procura o Produtor pelo nome e oferece só quem casa', async () => {
    servirCadastro({ produtores: [ANA, AGRO_BETO], propriedades: [] });

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');
    await abrirANova();

    await userEvent.type(screen.getByRole('combobox', { name: 'Produtor' }), 'beto');

    expect(await screen.findByRole('option', { name: 'Agro Beto' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Ana Lima' })).toBeNull();
  });

  it('diz que não achou ninguém, em vez de oferecer lista vazia sem explicação', async () => {
    servirCadastro({ produtores: [ANA], propriedades: [] });

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');
    await abrirANova();

    await userEvent.type(screen.getByRole('combobox', { name: 'Produtor' }), 'zzz');

    expect(await screen.findByText('Nada encontrado com esse nome.')).toBeInTheDocument();
  });

  it('registra a Propriedade com o Produtor, o nome, a cidade e as três áreas', async () => {
    const propriedades: Propriedade[] = [];
    servirCadastro(
      { produtores: [ANA], propriedades },
      {
        'POST /api/propriedades': () => {
          propriedades.push(BOA_VISTA);

          return { corpo: BOA_VISTA };
        },
      },
    );

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');

    await preencherAPropriedade();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('Fazenda Boa Vista')).toBeInTheDocument();
    await expect(corpoEnviadoPara('POST', '/api/propriedades')).resolves.toEqual({
      produtorId: ANA.id,
      nome: 'Fazenda Boa Vista',
      cidade: 'Uberaba',
      estado: 'MG',
      areaTotal: 100,
      areaAgricultavel: 60,
      areaDeVegetacao: 30,
    });
  });

  it('mostra a recusa da soma das áreas com o texto que a API mandou', async () => {
    servirCadastro(
      { produtores: [ANA], propriedades: [] },
      {
        'POST /api/propriedades': () => ({
          problema: {
            status: 400,
            title: 'Bad Request',
            detail: 'A soma da Área Agricultável com a Área de Vegetação passa da Área Total.',
            codigo: 'AREAS_NAO_FECHAM',
          },
        }),
      },
    );

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');

    await preencherAPropriedade();
    await preencher('Vegetação', '90');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A soma da Área Agricultável com a Área de Vegetação passa da Área Total.',
    );
  });

  it('edita a Propriedade sem oferecer o Produtor, que não muda', async () => {
    const propriedades = [{ ...BOA_VISTA }];
    servirCadastro(
      { produtores: [ANA], propriedades },
      {
        'PUT /api/propriedades/:id': ({ corpo }) => {
          const pedido = corpo as { nome: string };
          propriedades[0] = { ...BOA_VISTA, nome: pedido.nome };

          return { corpo: propriedades[0] };
        },
      },
    );

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Fazenda Boa Vista');

    await userEvent.click(screen.getByRole('button', { name: 'Editar Fazenda Boa Vista' }));
    expect(screen.queryByLabelText('Produtor')).toBeNull();

    await preencher('Nome', 'Fazenda Boa Vista II');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Fazenda Boa Vista II')).toBeInTheDocument();
    await expect(corpoEnviadoPara('PUT', `/api/propriedades/${BOA_VISTA.id}`)).resolves.toEqual({
      nome: 'Fazenda Boa Vista II',
      cidade: 'Uberaba',
      estado: 'MG',
      areaTotal: 100,
      areaAgricultavel: 60,
      areaDeVegetacao: 30,
    });
  });

  it('pergunta antes de excluir, e avisa que os Plantios vão junto', async () => {
    const propriedades = [{ ...BOA_VISTA }];
    servirCadastro(
      { produtores: [ANA], propriedades },
      {
        'DELETE /api/propriedades/:id': () => {
          propriedades.length = 0;

          return { semConteudo: true };
        },
      },
    );

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Fazenda Boa Vista');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Fazenda Boa Vista' }));
    expect(
      screen.getByText('Excluir Fazenda Boa Vista? Os Plantios dessa Propriedade vão junto.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Nenhuma Propriedade cadastrada ainda.')).toBeInTheDocument();
  });

  it('não deixa registrar Propriedade sem Produtor no cadastro', async () => {
    servirCadastro({ produtores: [], propriedades: [] });

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');

    await abrirANova();

    await waitFor(() => {
      expect(
        screen.getByText('Registre um Produtor antes: toda Propriedade é registrada em nome de um.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Registrar' })).toBeNull();
  });

  it('leva de cada Propriedade aos Plantios dela', async () => {
    servirCadastro({ produtores: [ANA], propriedades: [BOA_VISTA] });

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Fazenda Boa Vista');

    expect(screen.getByRole('link', { name: 'Ver os Plantios de Fazenda Boa Vista' })).toHaveAttribute(
      'href',
      `/cadastro/plantios?propriedade=${BOA_VISTA.id}&produtor=${ANA.id}`,
    );
  });

  it('põe a conta das áreas na frente de quem a está fazendo de cabeça', async () => {
    servirCadastro({ produtores: [ANA], propriedades: [] });

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');
    await abrirANova();
    await preencher('Total', '100');
    await preencher('Agricultável', '60');
    await preencher('Vegetação', '30');

    // A conta é só informação: quem recusa continua sendo a API.
    expect(
      screen.getByText('Agricultável mais vegetação: 90 ha de 100 ha no total.'),
    ).toBeInTheDocument();
  });

  describe('recortada por um Produtor', () => {
    /** O endereço com o recorte, que é de onde a seção tira o Produtor. */
    const RECORTE = `/cadastro/propriedades?produtor=${ANA.id}`;

    /** A rota que recorta: a listagem geral não aceita filtro, a do Produtor sim. */
    function servirODeAna() {
      servirCadastro(
        { produtores: [ANA, AGRO_BETO], propriedades: [BOA_VISTA, SITIO_DO_MEIO] },
        {
          'GET /api/produtores/:id': () => ({
            corpo: {
              ...ANA,
              propriedades: { itens: [BOA_VISTA], total: 1, pagina: 1, tamanho: 10 },
            },
          }),
        },
      );
    }

    it('lista só as Propriedades dele, e diz de quem é o recorte', async () => {
      servirODeAna();

      renderizarNoCadastro(<PropriedadesSecao />, RECORTE);

      expect(
        await screen.findByRole('heading', { name: 'Propriedades de Ana Lima', level: 2 }),
      ).toBeInTheDocument();
      expect(screen.getByText('Fazenda Boa Vista')).toBeInTheDocument();
      expect(screen.queryByText('Sítio do Meio')).toBeNull();
    });

    it('oferece a saída para o cadastro inteiro', async () => {
      servirODeAna();

      renderizarNoCadastro(<PropriedadesSecao />, RECORTE);
      await screen.findByText('Fazenda Boa Vista');

      expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute(
        'href',
        '/cadastro/propriedades',
      );
    });

    it('registra em nome dele sem pedir que se escolha o Produtor de novo', async () => {
      servirODeAna();

      renderizarNoCadastro(<PropriedadesSecao />, `${RECORTE}&novo=1`);

      // Chegou-se aqui pedindo para registrar, então o formulário já está aberto, e o
      // campo de busca nasce mostrando o Produtor do recorte em vez de pedir de novo.
      expect(await screen.findByRole('combobox', { name: 'Produtor' })).toHaveValue('Ana Lima');
    });
  });

  it('não deixa o navegador barrar o envio no lugar da API', async () => {
    servirCadastro({ produtores: [ANA], propriedades: [] });

    renderizarNoCadastro(<PropriedadesSecao />);
    await screen.findByText('Nenhuma Propriedade cadastrada ainda.');
    await abrirANova();

    const formulario = screen.getByRole('button', { name: 'Registrar' }).closest('form');
    expect(formulario).toHaveAttribute('novalidate');
  });
});
