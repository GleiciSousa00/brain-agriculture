import type { Propriedade } from '@cadastro-rural/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarNoCadastro, servirCadastro } from '../../teste/cadastro-falso';
import { AGRO_BETO, ANA, BOA_VISTA, SITIO_DO_MEIO } from '../../teste/exemplos';
import { corpoEnviadoPara } from '../../teste/fetch-falso';
import { PropriedadesSecao } from './PropriedadesSecao';

async function preencher(rotulo: string, texto: string): Promise<void> {
  const campo = screen.getByLabelText(rotulo);
  await userEvent.clear(campo);
  await userEvent.type(campo, texto);
}

async function preencherAPropriedade(): Promise<void> {
  await userEvent.selectOptions(screen.getByLabelText('Produtor'), ANA.id);
  await preencher('Nome', 'Fazenda Boa Vista');
  await preencher('Cidade', 'Uberaba');
  await preencher('Estado', 'MG');
  await preencher('Área total', '100');
  await preencher('Área agricultável', '60');
  await preencher('Área de vegetação', '30');
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
    // Duas na mesma cidade, distinguidas pelo nome, que é para o que o nome existe.
    expect(screen.getByRole('row', { name: /Sítio do Meio/ })).toBeInTheDocument();
  });

  it('escolhe o Produtor numa lista, e não em campo de texto livre', async () => {
    servirCadastro({ produtores: [ANA, AGRO_BETO], propriedades: [] });

    renderizarNoCadastro(<PropriedadesSecao />);

    const campo = await screen.findByLabelText('Produtor');
    expect(campo.tagName).toBe('SELECT');
    expect(within(campo).getByRole('option', { name: 'Ana Lima' })).toBeInTheDocument();
    expect(within(campo).getByRole('option', { name: 'Agro Beto' })).toBeInTheDocument();
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
    await preencher('Área de vegetação', '90');
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

    await waitFor(() => {
      expect(
        screen.getByText('Registre um Produtor antes: toda Propriedade é registrada em nome de um.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Registrar' })).toBeNull();
  });
});
