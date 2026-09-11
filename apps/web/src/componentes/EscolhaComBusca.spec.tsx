import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Opcao } from './Escolha';
import { EscolhaComBusca } from './EscolhaComBusca';

const PROPRIEDADES: Opcao[] = [
  { valor: 'p1', rotulo: 'Fazenda Boa Vista' },
  { valor: 'p2', rotulo: 'Fazenda Cana Brava' },
  { valor: 'p3', rotulo: 'Sítio São José' },
];

/** A mesma dobra do banco: quem procura digita sem caixa nem acento. */
function procurarNaLista(busca: string): Promise<Opcao[]> {
  const dobrado = busca
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  return Promise.resolve(
    PROPRIEDADES.filter((opcao) =>
      opcao.rotulo
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .includes(dobrado),
    ),
  );
}

function Campo({ procurar = procurarNaLista }: { procurar?: (busca: string) => Promise<Opcao[]> }) {
  const [escolhida, setEscolhida] = useState<Opcao>();

  return (
    <EscolhaComBusca
      rotulo="Propriedade"
      valor={escolhida?.valor ?? ''}
      nomeDoValor={escolhida?.rotulo}
      aoMudar={setEscolhida}
      vazia="Procure uma Propriedade pelo nome"
      procurar={procurar}
    />
  );
}

describe('o campo de escolha que procura', () => {
  it('oferece só o que casa com o que se digitou', async () => {
    render(<Campo />);

    await userEvent.type(screen.getByRole('combobox', { name: 'Propriedade' }), 'cana');

    expect(await screen.findByRole('option', { name: 'Fazenda Cana Brava' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fazenda Boa Vista' })).toBeNull();
  });

  it('acha o nome acentuado a partir do que se digita sem acento', async () => {
    render(<Campo />);

    await userEvent.type(screen.getByRole('combobox', { name: 'Propriedade' }), 'sao jose');

    expect(await screen.findByRole('option', { name: 'Sítio São José' })).toBeInTheDocument();
  });

  it('escolhe pelo teclado, sem enviar o formulário', async () => {
    render(<Campo />);
    const campo = screen.getByRole('combobox', { name: 'Propriedade' });

    await userEvent.type(campo, 'fazenda');
    await screen.findByRole('option', { name: 'Fazenda Boa Vista' });
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(campo).toHaveValue('Fazenda Cana Brava');
  });

  it('diz qual opção está destacada, para quem ouve a tela saber onde está', async () => {
    render(<Campo />);
    const campo = screen.getByRole('combobox', { name: 'Propriedade' });

    await userEvent.type(campo, 'fazenda');
    await screen.findByRole('option', { name: 'Fazenda Boa Vista' });

    const primeira = screen.getByRole('option', { name: 'Fazenda Boa Vista' });
    expect(campo).toHaveAttribute('aria-activedescendant', primeira.id);
    expect(campo).toHaveAttribute('aria-expanded', 'true');
  });

  it('desiste com Escape e volta a mostrar o que já estava escolhido', async () => {
    render(<Campo />);
    const campo = screen.getByRole('combobox', { name: 'Propriedade' });

    await userEvent.type(campo, 'cana');
    await userEvent.click(await screen.findByRole('option', { name: 'Fazenda Cana Brava' }));
    await userEvent.type(campo, 'boa');
    await userEvent.keyboard('{Escape}');

    expect(campo).toHaveValue('Fazenda Cana Brava');
    expect(campo).toHaveAttribute('aria-expanded', 'false');
  });

  it('diz que não achou nada, em vez de deixar a lista vazia sem explicação', async () => {
    render(<Campo />);

    await userEvent.type(screen.getByRole('combobox', { name: 'Propriedade' }), 'zzz');

    expect(await screen.findByText('Nada encontrado com esse nome.')).toBeInTheDocument();
  });

  it('mostra a recusa quando a busca falha, e não uma lista vazia', async () => {
    const procurar = vi.fn(() => Promise.reject(new Error('sem rede')));

    render(<Campo procurar={procurar} />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Propriedade' }), 'boa');

    expect(await screen.findByText('Algo deu errado ao falar com a API.')).toBeInTheDocument();
  });

  it('procura uma vez só para uma palavra digitada de uma vez', async () => {
    const procurar = vi.fn(procurarNaLista);

    render(<Campo procurar={procurar} />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Propriedade' }), 'boa vista');
    await screen.findByRole('option', { name: 'Fazenda Boa Vista' });

    expect(procurar).toHaveBeenCalledTimes(1);
    expect(procurar).toHaveBeenCalledWith('boa vista');
  });
});
