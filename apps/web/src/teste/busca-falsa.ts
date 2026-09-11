import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Escolhe no campo que procura: digita o pedaço do nome e clica na opção que voltou.
 *
 * A busca só sai depois da espera do campo, e a opção só existe depois da resposta. Por
 * isso a espera é pela opção, e não por tempo.
 */
export async function procurarEEscolher(rotulo: string, texto: string, nome: string): Promise<void> {
  await userEvent.type(screen.getByRole('combobox', { name: rotulo }), texto);
  await userEvent.click(await screen.findByRole('option', { name: nome }));
}
