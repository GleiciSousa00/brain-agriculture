import { useId, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import { Escolha } from '../../componentes/Escolha';
import { useCadastro } from './CadastroContexto';
import { PlantiosDaPropriedade } from './PlantiosDaPropriedade';

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

  const [propriedadeId, setPropriedadeId] = useState('');
  const [culturaId, setCulturaId] = useState('');
  const [safraId, setSafraId] = useState('');
  const [recusa, setRecusa] = useState<string>();
  const tituloId = useId();

  async function enviar(): Promise<void> {
    setRecusa(undefined);

    try {
      await registrarPlantio({ propriedadeId, culturaId, safraId });
      setCulturaId('');
      setSafraId('');
    } catch (causa: unknown) {
      // A unicidade da trinca é regra da API. A tela repete o que ela respondeu.
      setRecusa(mensagemDe(causa));
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
            setRecusa(undefined);
          }}
          vazia="Escolha uma Propriedade"
          opcoes={propriedades.map((propriedade) => ({
            valor: propriedade.id,
            rotulo: propriedade.nome,
          }))}
        />

        {propriedadeId !== '' && (
          <form
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

      {propriedadeId === '' ? (
        <p className="vazio">{SEM_PROPRIEDADE_ESCOLHIDA}</p>
      ) : (
        // A chave refaz a tabela ao trocar de Propriedade, e com ela a página em que se
        // estava: a terceira página de uma Propriedade não diz nada sobre a outra.
        <PlantiosDaPropriedade key={propriedadeId} propriedadeId={propriedadeId} />
      )}
    </section>
  );
}
