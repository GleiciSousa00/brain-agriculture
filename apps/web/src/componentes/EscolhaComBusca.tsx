import { useEffect, useId, useRef, useState } from 'react';
import { mensagemDe } from '../api/chamada';
import type { Opcao } from './Escolha';

/**
 * Quanto tempo o campo espera antes de procurar.
 *
 * Procurar a cada tecla manda uma requisição por caractere, e a resposta da penúltima
 * chega depois da última. A espera é curta o bastante para parecer imediata e longa o
 * bastante para quem digita "Boa Vista" mandar uma busca, e não nove.
 */
const ESPERA_ATE_PROCURAR = 250;

const PROCURANDO = 'Procurando…';
const NADA_ENCONTRADO = 'Nada encontrado com esse nome.';

interface Props {
  rotulo: string;
  /** O identificador escolhido, ou vazio enquanto ninguém escolheu. */
  valor: string;
  /** O nome do escolhido, para o campo mostrar o que está escolhido e não o identificador. */
  nomeDoValor?: string;
  aoMudar: (escolhida: Opcao) => void;
  /** O texto do campo em branco, como "Procure uma Propriedade". */
  vazia: string;
  /** Traz o que casa com o que se digitou. Quem chama é que sabe em qual listagem procurar. */
  procurar: (busca: string) => Promise<Opcao[]>;
}

/**
 * Um campo de escolha que procura no servidor em vez de oferecer os cem primeiros.
 *
 * O campo de lista fixa só alcançava o que tivesse vindo na primeira página do catálogo:
 * passando disso, a Propriedade existia e não havia como apontar para ela. Aqui o que a
 * lista oferece é o que casa com o que se digitou, e o que casa é a API quem diz.
 *
 * A escolha continua sendo de uma opção, e nunca do texto digitado: o campo é um jeito de
 * achar a linha, não de criar uma.
 */
export function EscolhaComBusca({ rotulo, valor, nomeDoValor, aoMudar, vazia, procurar }: Props) {
  const campoId = useId();
  const listaId = useId();
  const [texto, setTexto] = useState('');
  const [aberta, setAberta] = useState(false);
  const [destacada, setDestacada] = useState(0);
  const [opcoes, setOpcoes] = useState<Opcao[]>();
  const [erro, setErro] = useState<string>();

  const procurarAgora = useRef(procurar);

  useEffect(() => {
    procurarAgora.current = procurar;
  });

  // Fechada, a lista não procura: o que se vê é o nome do que já está escolhido.
  useEffect(() => {
    if (!aberta) {
      return;
    }

    let cancelado = false;
    setErro(undefined);

    const agendada = setTimeout(() => {
      procurarAgora
        .current(texto)
        .then((encontradas) => {
          if (!cancelado) {
            setOpcoes(encontradas);
            setDestacada(0);
          }
        })
        .catch((causa: unknown) => {
          if (!cancelado) {
            setOpcoes(undefined);
            setErro(mensagemDe(causa));
          }
        });
    }, ESPERA_ATE_PROCURAR);

    return () => {
      cancelado = true;
      clearTimeout(agendada);
    };
  }, [texto, aberta]);

  function fechar(): void {
    setAberta(false);
    setOpcoes(undefined);
    setTexto('');
  }

  function escolher(opcao: Opcao): void {
    aoMudar(opcao);
    fechar();
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>): void {
    const encontradas = opcoes ?? [];

    if (evento.key === 'Escape') {
      fechar();

      return;
    }

    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      setAberta(true);

      if (encontradas.length > 0) {
        const passo = evento.key === 'ArrowDown' ? 1 : encontradas.length - 1;
        setDestacada((anterior) => (anterior + passo) % encontradas.length);
      }

      return;
    }

    if (evento.key === 'Enter' && aberta) {
      // O campo não envia o formulário: aqui o Enter escolhe a linha destacada, que é o
      // que quem navega por teclado espera de uma lista aberta.
      evento.preventDefault();
      const escolhida = encontradas[destacada];

      if (escolhida !== undefined) {
        escolher(escolhida);
      }
    }
  }

  const escolhida = opcoes?.[destacada];

  return (
    <p className="campo escolha-com-busca">
      <label htmlFor={campoId}>{rotulo}</label>
      <input
        id={campoId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={aberta}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={aberta && escolhida !== undefined ? opcaoId(listaId, destacada) : undefined}
        placeholder={nomeDoValor ?? vazia}
        value={aberta ? texto : (nomeDoValor ?? '')}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAberta(true);
        }}
        onFocus={() => {
          setAberta(true);
        }}
        // O clique numa opção tira o foco do campo antes de virar clique. Fechar no
        // desfoque sem esperar faria a lista sumir debaixo do dedo, e a escolha se perder.
        onBlur={() => {
          setTimeout(fechar, 0);
        }}
        onKeyDown={aoTeclar}
      />
      <span className="ajuda" role="status">
        {aberta && opcoes === undefined && erro === undefined && PROCURANDO}
        {aberta && opcoes?.length === 0 && NADA_ENCONTRADO}
      </span>
      {erro !== undefined && <span className="ajuda recusa">{erro}</span>}
      <ul className={aberta && opcoes !== undefined ? 'opcoes' : 'opcoes escondida'} id={listaId} role="listbox">
        {(opcoes ?? []).map((opcao, ordem) => (
          <li
            key={opcao.valor}
            id={opcaoId(listaId, ordem)}
            role="option"
            aria-selected={opcao.valor === valor}
            className={ordem === destacada ? 'destacada' : undefined}
            onMouseDown={(evento) => {
              // Sem isto o campo perde o foco antes do clique, e o clique nunca acontece.
              evento.preventDefault();
            }}
            onClick={() => {
              escolher(opcao);
            }}
          >
            {opcao.rotulo}
          </li>
        ))}
      </ul>
    </p>
  );
}

/** Cada opção precisa de identificador próprio: é por ele que o campo diz qual destacou. */
function opcaoId(listaId: string, ordem: number): string {
  return `${listaId}-${String(ordem)}`;
}
