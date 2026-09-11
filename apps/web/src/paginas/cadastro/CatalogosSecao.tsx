import { useId, useState } from 'react';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Lista } from '../../componentes/Lista';
import { comoNumero, formatarContagem } from '../../formato';
import { useCadastro } from './CadastroContexto';
import { useTentativa } from './useTentativa';

const SEM_CULTURA = 'Nenhuma Cultura no catálogo ainda.';
const SEM_SAFRA = 'Nenhuma Safra registrada ainda.';
const AJUDA_DA_CULTURA =
  'A espécie, como Soja, Milho ou Café. O nome não se edita: para corrigi-lo, exclua e acrescente de novo.';
const AJUDA_DA_SAFRA = 'O ano do ciclo agrícola, como 2026.';

/**
 * Os dois catálogos que o Plantio consome.
 *
 * Nenhum dos dois é paginado na API, então aqui a lista é a lista inteira, sem controle de
 * página. Nenhum dos dois se edita: a API não oferece a operação, e o conserto de um nome
 * digitado errado é excluir e acrescentar de novo.
 *
 * A exclusão existe para esse conserto, e a API a recusa quando algum Plantio aponta para
 * a linha: o Plantio é registro do que aconteceu na terra, e não some porque alguém
 * arrumou o catálogo. A recusa aparece aqui com o texto que ela mandou.
 *
 * A Safra não está nos critérios da issue, mas o formulário de Plantio escolhe a Safra de
 * uma lista, e numa base recém-criada essa lista está vazia. Sem esta seção não haveria
 * como registrar Plantio nenhum pela interface.
 */
export function CatalogosSecao() {
  const {
    culturas,
    safras,
    carregando,
    acrescentarCultura,
    excluirCultura,
    criarSafra,
    excluirSafra,
  } = useCadastro();

  const [nomeDaCultura, setNomeDaCultura] = useState('');
  const [anoDaSafra, setAnoDaSafra] = useState('');
  const [aberto, setAberto] = useState<'cultura' | 'safra'>();
  const tentativaDaCultura = useTentativa();
  const tentativaDaSafra = useTentativa();
  // A exclusão tem tentativa própria porque o formulário some enquanto ela acontece, e a
  // recusa dela iria junto.
  const exclusaoDaCultura = useTentativa();
  const exclusaoDaSafra = useTentativa();

  /** Só o estado dos formulários. O desfecho da última escrita sobrevive ao fechamento. */
  function esvaziar(): void {
    setAberto(undefined);
    setNomeDaCultura('');
    setAnoDaSafra('');
  }

  function fechar(): void {
    esvaziar();
    tentativaDaCultura.limpar();
    tentativaDaSafra.limpar();
  }

  async function enviarCultura(): Promise<void> {
    const passou = await tentativaDaCultura.tentar(
      () => acrescentarCultura({ nome: nomeDaCultura }),
      `Cultura ${nomeDaCultura} acrescentada ao catálogo.`,
    );

    if (passou) {
      esvaziar();
    }
  }

  async function enviarSafra(): Promise<void> {
    const passou = await tentativaDaSafra.tentar(
      () => criarSafra({ ano: comoNumero(anoDaSafra) }),
      `Safra de ${anoDaSafra} registrada.`,
    );

    if (passou) {
      esvaziar();
    }
  }

  /** A recusa da linha em uso vem da API, e é o texto dela que aparece na lista. */
  async function apagarCultura(id: string, nome: string): Promise<void> {
    await exclusaoDaCultura.tentar(() => excluirCultura(id), `Cultura ${nome} tirada do catálogo.`);
  }

  async function apagarSafra(id: string, ano: number): Promise<void> {
    await exclusaoDaSafra.tentar(() => excluirSafra(id), `Safra de ${ano} tirada do cadastro.`);
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
        {/* Fora do formulário, que some assim que a escrita passa. */}
        {exclusaoDaCultura.recusa !== undefined && <p role="alert">{exclusaoDaCultura.recusa}</p>}
        {tentativaDaCultura.aviso !== undefined && (
          <p className="acerto" role="status">
            {tentativaDaCultura.aviso}
          </p>
        )}
        {exclusaoDaCultura.aviso !== undefined && (
          <p className="acerto" role="status">
            {exclusaoDaCultura.aviso}
          </p>
        )}
        {culturas.length === 0 ? (
          <p className="vazio">{SEM_CULTURA}</p>
        ) : (
          <ul className="catalogo">
            {culturas.map((cultura) => (
              <li key={cultura.id}>
                <span>{cultura.nome}</span>
                <BotaoDeExclusao
                  rotulo={`Excluir ${cultura.nome}`}
                  pergunta={`Tirar ${cultura.nome} do catálogo?`}
                  aoConfirmar={() => {
                    void apagarCultura(cultura.id, cultura.nome);
                  }}
                />
              </li>
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
        {exclusaoDaSafra.recusa !== undefined && <p role="alert">{exclusaoDaSafra.recusa}</p>}
        {tentativaDaSafra.aviso !== undefined && (
          <p className="acerto" role="status">
            {tentativaDaSafra.aviso}
          </p>
        )}
        {exclusaoDaSafra.aviso !== undefined && (
          <p className="acerto" role="status">
            {exclusaoDaSafra.aviso}
          </p>
        )}
        {safras.length === 0 ? (
          <p className="vazio">{SEM_SAFRA}</p>
        ) : (
          <ul className="catalogo">
            {safras.map((safra) => (
              <li key={safra.id}>
                <span className="tabular">{safra.ano}</span>
                <BotaoDeExclusao
                  rotulo={`Excluir a Safra de ${String(safra.ano)}`}
                  pergunta={`Tirar a Safra de ${String(safra.ano)} do cadastro?`}
                  aoConfirmar={() => {
                    void apagarSafra(safra.id, safra.ano);
                  }}
                />
              </li>
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
