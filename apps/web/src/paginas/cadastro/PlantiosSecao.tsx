import { useId, useState } from 'react';
import { Escolha, NADA_ESCOLHIDO } from '../../componentes/Escolha';
import { useCadastro } from './CadastroContexto';
import { PlantiosDaPropriedade } from './PlantiosDaPropriedade';
import { useTentativa } from './useTentativa';

const SEM_PROPRIEDADE_ESCOLHIDA = 'Escolha uma Propriedade para ver e registrar os Plantios dela.';
const SEM_PROPRIEDADE = 'Registre uma Propriedade antes: todo Plantio acontece em uma.';

/**
 * Os Plantios de uma Propriedade de cada vez.
 *
 * A Propriedade escolhida no alto manda nas duas coisas: é a que a tabela mostra e é onde
 * o formulário registra. Um Plantio é a trinca de Propriedade, Cultura e Safra, e nenhuma
 * das três se digita: as três se apontam nas listas.
 */
export function PlantiosSecao() {
  const { propriedades, culturas, safras, registrarPlantio } = useCadastro();

  const [propriedadeId, setPropriedadeId] = useState(NADA_ESCOLHIDO);
  const [culturaId, setCulturaId] = useState(NADA_ESCOLHIDO);
  const [safraId, setSafraId] = useState(NADA_ESCOLHIDO);
  const { recusa, tentar, limpar } = useTentativa();
  const tituloId = useId();

  /** A unicidade da trinca é regra da API. A tela repete o que ela respondeu. */
  async function enviar(): Promise<void> {
    if (await tentar(() => registrarPlantio({ propriedadeId, culturaId, safraId }))) {
      setCulturaId(NADA_ESCOLHIDO);
      setSafraId(NADA_ESCOLHIDO);
    }
  }

  if (propriedades.length === 0) {
    return (
      <section className="secao" aria-labelledby={tituloId}>
        <h2 id={tituloId}>Plantios</h2>
        <p className="cartao vazio">{SEM_PROPRIEDADE}</p>
      </section>
    );
  }

  return (
    <section className="secao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Plantios</h2>

      <div className="cartao formulario">
        <Escolha
          rotulo="Propriedade"
          valor={propriedadeId}
          aoMudar={(valor) => {
            setPropriedadeId(valor);
            limpar();
          }}
          vazia="Escolha uma Propriedade"
          opcoes={propriedades.map((propriedade) => ({
            valor: propriedade.id,
            rotulo: propriedade.nome,
          }))}
        />

        {propriedadeId !== NADA_ESCOLHIDO && (
          <form
            noValidate
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar();
            }}
          >
            <h3>Novo Plantio</h3>
            <Escolha
              rotulo="Cultura"
              valor={culturaId}
              aoMudar={setCulturaId}
              vazia="Escolha uma Cultura"
              opcoes={culturas.map((cultura) => ({ valor: cultura.id, rotulo: cultura.nome }))}
            />
            <Escolha
              rotulo="Safra"
              valor={safraId}
              aoMudar={setSafraId}
              vazia="Escolha uma Safra"
              opcoes={safras.map((safra) => ({ valor: safra.id, rotulo: String(safra.ano) }))}
            />
            <p className="acoes">
              <button type="submit">Registrar</button>
            </p>
            {recusa !== undefined && <p role="alert">{recusa}</p>}
          </form>
        )}
      </div>

      {propriedadeId === NADA_ESCOLHIDO ? (
        <p className="vazio">{SEM_PROPRIEDADE_ESCOLHIDA}</p>
      ) : (
        <PlantiosDaPropriedade key={propriedadeId} propriedadeId={propriedadeId} />
      )}
    </section>
  );
}
