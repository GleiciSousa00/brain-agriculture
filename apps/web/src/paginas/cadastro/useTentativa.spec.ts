import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErroDaApi } from '../../api/chamada';
import { useTentativa } from './useTentativa';

describe('a tentativa de escrita de uma seção', () => {
  it('devolve que passou e não deixa recusa nenhuma na tela', async () => {
    const { result } = renderHook(() => useTentativa());

    let passou = false;
    await act(async () => {
      passou = await result.current.tentar(() => Promise.resolve());
    });

    expect(passou).toBe(true);
    expect(result.current.recusa).toBeUndefined();
  });

  it('guarda o texto que a API mandou quando ela recusa', async () => {
    const { result } = renderHook(() => useTentativa());

    let passou = true;
    await act(async () => {
      passou = await result.current.tentar(() =>
        Promise.reject(new ErroDaApi('O Documento informado não é um CPF nem um CNPJ válido.')),
      );
    });

    expect(passou).toBe(false);
    expect(result.current.recusa).toBe('O Documento informado não é um CPF nem um CNPJ válido.');
  });

  it('guarda o texto padrão quando a falha não é uma recusa da API', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() => Promise.reject(new TypeError('fetch failed')));
    });

    expect(result.current.recusa).toBe('Algo deu errado ao falar com a API.');
  });

  it('leva embora a recusa anterior antes de saber o desfecho da nova tentativa', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() =>
        Promise.reject(new ErroDaApi('O nome não pode ser vazio.')),
      );
    });
    expect(result.current.recusa).toBe('O nome não pode ser vazio.');

    let concluir = (): void => undefined;
    const emVoo = new Promise<void>((resolve) => {
      concluir = resolve;
    });
    let segunda!: Promise<boolean>;

    act(() => {
      segunda = result.current.tentar(() => emVoo);
    });

    expect(result.current.recusa).toBeUndefined();

    await act(async () => {
      concluir();
      await segunda;
    });

    expect(result.current.recusa).toBeUndefined();
  });

  it('zera a recusa quando quem a recebeu sai da tela', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() =>
        Promise.reject(new ErroDaApi('O nome não pode ser vazio.')),
      );
    });
    expect(result.current.recusa).toBe('O nome não pode ser vazio.');

    act(() => {
      result.current.limpar();
    });

    expect(result.current.recusa).toBeUndefined();
  });

  it('guarda o aviso de acerto quando a escrita passa', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() => Promise.resolve(), 'Produtor Ana Lima registrado.');
    });

    expect(result.current.aviso).toBe('Produtor Ana Lima registrado.');
    expect(result.current.recusa).toBeUndefined();
  });

  it('fica calado quando a escrita passa sem aviso pedido', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() => Promise.resolve());
    });

    expect(result.current.aviso).toBeUndefined();
  });

  it('não anuncia acerto de escrita que a API recusou', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(
        () => Promise.reject(new ErroDaApi('O nome não pode ser vazio.')),
        'Produtor registrado.',
      );
    });

    expect(result.current.aviso).toBeUndefined();
    expect(result.current.recusa).toBe('O nome não pode ser vazio.');
  });

  it('leva embora o aviso anterior antes de saber o desfecho da nova tentativa', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() => Promise.resolve(), 'Produtor registrado.');
    });
    expect(result.current.aviso).toBe('Produtor registrado.');

    await act(async () => {
      await result.current.tentar(() =>
        Promise.reject(new ErroDaApi('Já existe Produtor com esse Documento.')),
      );
    });

    expect(result.current.aviso).toBeUndefined();
  });

  it('zera o aviso quando quem o recebeu sai da tela', async () => {
    const { result } = renderHook(() => useTentativa());

    await act(async () => {
      await result.current.tentar(() => Promise.resolve(), 'Produtor registrado.');
    });

    act(() => {
      result.current.limpar();
    });

    expect(result.current.aviso).toBeUndefined();
  });
});
