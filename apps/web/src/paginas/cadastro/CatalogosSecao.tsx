import { useId, useState } from 'react';
import { Lista } from '../../componentes/Lista';
import { comoNumero, formatarContagem } from '../../formato';
import { useCadastro } from './CadastroContexto';
import { useTentativa } from './useTentativa';

const SEM_CULTURA = 'Nenhuma Cultura no catálogo ainda.';
const SEM_SAFRA = 'Nenhuma Safra registrada ainda.';
const AJUDA_DA_CULTURA =
  'A espécie, como Soja, Milho ou Café. Uma vez acrescentada, não se edita nem se exclui.';
const AJUDA_DA_SAFRA = 'O ano do ciclo agrícola, como 2026.';

/**
 * Os dois catálogos que o Plantio consome.
 *
 * Nenhum dos dois é paginado na API, então aqui a lista é a lista inteira, sem controle de
 * página. Também não se editam nem se excluem: a API não oferece as duas operações,
 * porque um Plantio já registrado aponta para eles.
 *
 * A Safra não está nos critérios da issue, mas o formulário de Plantio escolhe a Safra de
 * uma lista, e numa base recém-criada essa lista está vazia. Sem esta seção não haveria
 * como registrar Plantio nenhum pela interface.
 */
export function CatalogosSecao() {
  const { culturas, safras, carregando, acrescentarCultura, criarSafra } = useCadastro();

  const [nomeDaCultura, setNomeDaCultura] = useState('');
  const [anoDaSafra, setAnoDaSafra] = useState('');
  const [aberto, setAberto] = useState<'cultura' | 'safra'>();
  const tentativaDaCultura = useTentativa();
  const tentativaDaSafra = useTentativa();

  function fechar(): void {
    setAberto(undefined);
    setNomeDaCultura('');
    setAnoDaSafra('');
    tentativaDaCultura.limpar();
    tentativaDaSafra.limpar();
  }

  async function enviarCultura(): Promise<void> {
    if (await tentativaDaCultura.tentar(() => acrescentarCultura({ nome: nomeDaCultura }))) {
      fechar();
    }
  }

  async function enviarSafra(): Promise<void> {
    if (await tentativaDaSafra.tentar(() => criarSafra({ ano: comoNumero(anoDaSafra) }))) {
      fechar();
    }
  }

  return (
    <div className="catalogos">
      <Lista
        titulo="Culturas"
        // Enquanto o catálogo não volta não se sabe quanto existe, e um zero de espera
        // seria um número errado por alguns instantes.
        contagem={carregando ? undefined : formatarContagem(culturas.length, 'cultura', 'culturas')}
        acoes={
          aberto !== 'cultura' && (
            <button
              type="button"
              className="abridor"
              onClick={() => {
                setAberto('cultura');
              }}
            >
              Nova Cultura
            </button>
          )
        }
        embutido={
          aberto === 'cultura' && (
            <FormularioCurto
              rotulo="Nome da Cultura"
              ajuda={AJUDA_DA_CULTURA}
              valor={nomeDaCultura}
              aoMudar={setNomeDaCultura}
              acao="Acrescentar"
              recusa={tentativaDaCultura.recusa}
              aoEnviar={enviarCultura}
              aoFechar={fechar}
            />
          )
        }
      >
        {culturas.length === 0 ? (
          <p className="vazio">{SEM_CULTURA}</p>
        ) : (
          <ul className="catalogo">
            {culturas.map((cultura) => (
              <li key={cultura.id}>{cultura.nome}</li>
            ))}
          </ul>
        )}
      </Lista>

      <Lista
        titulo="Safras"
        contagem={carregando ? undefined : formatarContagem(safras.length, 'safra', 'safras')}
        acoes={
          aberto !== 'safra' && (
            <button
              type="button"
              className="abridor"
              onClick={() => {
                setAberto('safra');
              }}
            >
              Nova Safra
            </button>
          )
        }
        embutido={
          aberto === 'safra' && (
            <FormularioCurto
              rotulo="Ano da Safra"
              ajuda={AJUDA_DA_SAFRA}
              tipo="number"
              passo="1"
              estreito
              valor={anoDaSafra}
              aoMudar={setAnoDaSafra}
              acao="Registrar"
              recusa={tentativaDaSafra.recusa}
              aoEnviar={enviarSafra}
              aoFechar={fechar}
            />
          )
        }
      >
        {safras.length === 0 ? (
          <p className="vazio">{SEM_SAFRA}</p>
        ) : (
          <ul className="catalogo">
            {safras.map((safra) => (
              <li key={safra.id}>{safra.ano}</li>
            ))}
          </ul>
        )}
      </Lista>
    </div>
  );
}

interface PropsDoFormulario {
  rotulo: string;
  ajuda: string;
  tipo?: 'text' | 'number';
  passo?: string;
  /** O ano cabe em pouco espaço, e um campo largo demais promete mais do que aceita. */
  estreito?: boolean;
  valor: string;
  aoMudar: (valor: string) => void;
  acao: string;
  recusa?: string;
  aoEnviar: () => Promise<void>;
  aoFechar: () => void;
}

/**
 * Um campo só, e o que fazer com ele.
 *
 * Cultura e Safra se registram com um dado cada, então o formulário sai da própria faixa
 * da lista em vez de virar um cartão à parte: um cartão para um campo empurraria a lista
 * para fora da tela sem nenhuma contrapartida.
 */
function FormularioCurto({
  rotulo,
  ajuda,
  tipo = 'text',
  passo,
  estreito = false,
  valor,
  aoMudar,
  acao,
  recusa,
  aoEnviar,
  aoFechar,
}: PropsDoFormulario) {
  const campoId = useId();
  const ajudaId = useId();

  return (
    <form
      className="formulario-embutido"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        void aoEnviar();
      }}
    >
      <label htmlFor={campoId}>{rotulo}</label>
      <div className="linha">
        <input
          id={campoId}
          type={tipo}
          step={passo}
          className={estreito ? 'estreito' : undefined}
          value={valor}
          aria-describedby={ajudaId}
          onChange={(evento) => {
            aoMudar(evento.target.value);
          }}
        />
        <button type="submit">{acao}</button>
        <button type="button" onClick={aoFechar}>
          Cancelar
        </button>
      </div>
      <span className="ajuda" id={ajudaId}>
        {ajuda}
      </span>
      {recusa !== undefined && <p role="alert">{recusa}</p>}
    </form>
  );
}
