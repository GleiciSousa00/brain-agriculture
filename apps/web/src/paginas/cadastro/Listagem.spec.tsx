import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ErroDaApi } from '../../api/chamada';
import type { Pagina } from '../../api/pagina';
import { renderizarNoCadastro, servirCadastro } from '../../teste/cadastro-falso';
import { ANA } from '../../teste/exemplos';
import { useCadastro } from './CadastroContexto';
import { Listagem } from './Listagem';

const CARREGANDO = 'Carregando os itens…';
const VAZIO = 'Nada por aqui ainda.';

/** Nomes que ordenam como vêm, para que a página em que cada um cai seja evidente. */
function itensDe(quantos: number): string[] {
  return Array.from({ length: quantos }, (_, indice) => `Item ${String(indice).padStart(2, '0')}`);
}

/** Uma busca que fatia a lista como a API a fatiaria, honrando a página e o tamanho pedidos. */
function buscar(itens: string[]) {
  return (pagina: number, tamanho: number): Promise<Pagina<string>> => {
    const inicio = (pagina - 1) * tamanho;

    return Promise.resolve({
      itens: itens.slice(inicio, inicio + tamanho),
      total: itens.length,
      pagina,
      tamanho,
    });
  };
}

function tabelaDe(itens: string[]): ReactNode {
  return (
    <table>
      <tbody>
        {itens.map((item) => (
          <tr key={item}>
            <td>{item}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Um botão que faz uma escrita passar pelo contexto.
 *
 * É o único jeito de `versao` andar, porque quem a sobe é o provedor a cada escrita. O
 * `antes` é onde o teste mexe na base antes de a tabela ser avisada.
 */
function Escrita({ antes }: { antes?: () => void }) {
  const { criarProdutor } = useCadastro();

  return (
    <button
      type="button"
      onClick={() => {
        antes?.();
        void criarProdutor({ nome: ANA.nome, documento: '12345678900' });
      }}
    >
      Escrever
    </button>
  );
}

/** Monta a Listagem no provedor, com o botão de escrita ao lado. */
function montar(
  listar: (pagina: number, tamanho: number) => Promise<Pagina<string>>,
  antes?: () => void,
): void {
  renderizarNoCadastro(
    <>
      <Escrita antes={antes} />
      <Listagem listar={listar} carregando={CARREGANDO} vazio={VAZIO}>
        {tabelaDe}
      </Listagem>
    </>,
  );
}

function servir(): void {
  servirCadastro({ produtores: [ANA] }, { 'POST /api/produtores': () => ({ corpo: ANA }) });
}

describe('a listagem paginada do cadastro', () => {
  it('diz que está carregando enquanto a primeira fatia não volta', async () => {
    servir();

    montar(() => new Promise<Pagina<string>>(() => undefined));

    expect(await screen.findByRole('status')).toHaveTextContent(CARREGANDO);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('diz que não há nada em vez de mostrar tabela sem linha', async () => {
    servir();

    montar(buscar([]));

    expect(await screen.findByText(VAZIO)).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('mostra as linhas da página e quantas páginas existem', async () => {
    servir();

    montar(buscar(itensDe(23)));

    expect(await screen.findByText('Item 00')).toBeInTheDocument();
    expect(screen.getByText('Item 09')).toBeInTheDocument();
    expect(screen.queryByText('Item 10')).toBeNull();
    expect(screen.getByText('página 1 de 3')).toBeInTheDocument();
  });

  it('leva à página seguinte pelo botão de próxima', async () => {
    servir();

    montar(buscar(itensDe(23)));
    await screen.findByText('Item 00');

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByText('Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Item 00')).toBeNull();
    expect(screen.getByText('página 2 de 3')).toBeInTheDocument();
  });

  it('tira a tabela da tela quando a busca falha, em vez de deixar linha velha', async () => {
    servir();
    const itens = itensDe(23);
    let quebrada = false;

    montar((pagina, tamanho) =>
      quebrada ? Promise.reject(new ErroDaApi('O banco caiu.')) : buscar(itens)(pagina, tamanho),
    );
    await screen.findByText('Item 00');
    quebrada = true;

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O banco caiu.');
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByText(VAZIO)).toBeNull();
  });

  it('volta uma página quando a última fica vazia', async () => {
    servir();
    const itens = itensDe(11);

    montar(buscar(itens), () => {
      itens.length = 5;
    });
    await screen.findByText('Item 00');
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    await screen.findByText('Item 10');

    await userEvent.click(screen.getByRole('button', { name: 'Escrever' }));

    expect(await screen.findByText('Item 00')).toBeInTheDocument();
    expect(screen.queryByText(VAZIO)).toBeNull();
    expect(screen.queryByText(/página/)).toBeNull();
  });

  it('refaz a busca quando uma escrita muda a versão do cadastro', async () => {
    servir();
    const itens = itensDe(1);

    montar(buscar(itens), () => {
      itens.push('Item 01');
    });
    await screen.findByText('Item 00');

    await userEvent.click(screen.getByRole('button', { name: 'Escrever' }));

    expect(await screen.findByText('Item 01')).toBeInTheDocument();
  });

  it('não refaz a busca só porque o chamador passou outra função', async () => {
    servir();
    let buscas = 0;
    const fatiar = buscar(itensDe(1));

    function ComRenderizacoes() {
      const [vezes, setVezes] = useState(0);

      return (
        <>
          <button
            type="button"
            onClick={() => {
              setVezes(vezes + 1);
            }}
          >
            Renderizar de novo
          </button>
          <p>renderizações: {vezes}</p>
          <Listagem
            listar={(pagina, tamanho) => {
              buscas += 1;

              return fatiar(pagina, tamanho);
            }}
            carregando={CARREGANDO}
            vazio={VAZIO}
          >
            {tabelaDe}
          </Listagem>
        </>
      );
    }

    renderizarNoCadastro(<ComRenderizacoes />);
    await screen.findByText('Item 00');

    await userEvent.click(screen.getByRole('button', { name: 'Renderizar de novo' }));

    expect(await screen.findByText('renderizações: 1')).toBeInTheDocument();
    expect(buscas).toBe(1);
  });
});
