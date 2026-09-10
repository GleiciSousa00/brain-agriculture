import { useId, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import { Campo } from '../../componentes/Campo';
import { useCadastro } from './CadastroContexto';

const SEM_CULTURA = 'Nenhuma Cultura no catálogo ainda.';
const SEM_SAFRA = 'Nenhuma Safra registrada ainda.';

/**
 * Os dois catálogos que o Plantio consome.
 *
 * Nenhum dos dois é paginado na API, então aqui a lista é a lista inteira, sem tabela e
 * sem controle de página. Também não se editam nem se excluem: a API não oferece as duas
 * operações, porque um Plantio já registrado aponta para eles.
 *
 * A Safra não está nos critérios da issue, mas o formulário de Plantio escolhe a Safra de
 * uma lista, e numa base recém-criada essa lista está vazia. Sem esta seção não haveria
 * como registrar Plantio nenhum pela interface.
 */
export function CatalogosSecao() {
  const { culturas, safras, acrescentarCultura, criarSafra } = useCadastro();

  const [nomeDaCultura, setNomeDaCultura] = useState('');
  const [anoDaSafra, setAnoDaSafra] = useState('');
  const [recusaDaCultura, setRecusaDaCultura] = useState<string>();
  const [recusaDaSafra, setRecusaDaSafra] = useState<string>();
  const tituloId = useId();
  const culturasId = useId();
  const safrasId = useId();

  async function enviarCultura(): Promise<void> {
    setRecusaDaCultura(undefined);

    try {
      await acrescentarCultura({ nome: nomeDaCultura });
      setNomeDaCultura('');
    } catch (causa: unknown) {
      setRecusaDaCultura(mensagemDe(causa));
    }
  }

  async function enviarSafra(): Promise<void> {
    setRecusaDaSafra(undefined);

    try {
      // O campo devolve texto; a API espera o ano como número.
      await criarSafra({ ano: anoDaSafra.trim() === '' ? Number.NaN : Number(anoDaSafra) });
      setAnoDaSafra('');
    } catch (causa: unknown) {
      setRecusaDaSafra(mensagemDe(causa));
    }
  }

  return (
    <section className="secao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Culturas e Safras</h2>

      <div className="catalogos">
        <section className="cartao formulario" aria-labelledby={culturasId}>
          <h3 id={culturasId}>Culturas</h3>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviarCultura();
            }}
          >
            <Campo
              rotulo="Nome da Cultura"
              valor={nomeDaCultura}
              aoMudar={setNomeDaCultura}
              ajuda="A espécie, como Soja, Milho ou Café."
            />
            <p className="acoes">
              <button type="submit">Acrescentar</button>
            </p>
            {recusaDaCultura !== undefined && <p role="alert">{recusaDaCultura}</p>}
          </form>
          {culturas.length === 0 ? (
            <p className="vazio">{SEM_CULTURA}</p>
          ) : (
            <ul className="catalogo">
              {culturas.map((cultura) => (
                <li key={cultura.id}>{cultura.nome}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="cartao formulario" aria-labelledby={safrasId}>
          <h3 id={safrasId}>Safras</h3>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviarSafra();
            }}
          >
            <Campo
              rotulo="Ano da Safra"
              tipo="number"
              passo="1"
              valor={anoDaSafra}
              aoMudar={setAnoDaSafra}
              ajuda="O ano do ciclo agrícola, como 2026."
            />
            <p className="acoes">
              <button type="submit">Registrar</button>
            </p>
            {recusaDaSafra !== undefined && <p role="alert">{recusaDaSafra}</p>}
          </form>
          {safras.length === 0 ? (
            <p className="vazio">{SEM_SAFRA}</p>
          ) : (
            <ul className="catalogo">
              {safras.map((safra) => (
                <li key={safra.id}>{safra.ano}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
