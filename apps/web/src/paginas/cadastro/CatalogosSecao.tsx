import { useId, useState } from 'react';
import { Campo } from '../../componentes/Campo';
import { comoNumero } from '../../formato';
import { useCadastro } from './CadastroContexto';
import { useTentativa } from './useTentativa';

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
  const tentativaDaCultura = useTentativa();
  const tentativaDaSafra = useTentativa();
  const tituloId = useId();
  const culturasId = useId();
  const safrasId = useId();

  async function enviarCultura(): Promise<void> {
    if (await tentativaDaCultura.tentar(() => acrescentarCultura({ nome: nomeDaCultura }))) {
      setNomeDaCultura('');
    }
  }

  async function enviarSafra(): Promise<void> {
    if (await tentativaDaSafra.tentar(() => criarSafra({ ano: comoNumero(anoDaSafra) }))) {
      setAnoDaSafra('');
    }
  }

  return (
    <section className="secao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Culturas e Safras</h2>

      <div className="catalogos">
        <section className="cartao formulario" aria-labelledby={culturasId}>
          <h3 id={culturasId}>Culturas</h3>
          <form
            noValidate
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
            {tentativaDaCultura.recusa !== undefined && (
              <p role="alert">{tentativaDaCultura.recusa}</p>
            )}
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
            noValidate
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
            {tentativaDaSafra.recusa !== undefined && (
              <p role="alert">{tentativaDaSafra.recusa}</p>
            )}
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
