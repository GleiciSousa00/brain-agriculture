import { useCallback, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import { TAMANHO_DA_PAGINA } from '../../api/pagina';
import { listarPlantiosDaPropriedade } from '../../api/plantios';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Paginacao } from '../../componentes/Paginacao';
import { useCadastro } from './CadastroContexto';
import { useFatia } from './useFatia';

const VAZIO = 'Nenhum Plantio registrado nesta Propriedade ainda.';
const DESCONHECIDO = '—';

interface Props {
  propriedadeId: string;
}

/**
 * A tabela de Plantios de uma Propriedade.
 *
 * Ela é um componente à parte porque a listagem só existe a partir de uma Propriedade:
 * enquanto não há uma escolhida, não há o que buscar, e um gancho que buscasse assim
 * mesmo pediria a rota de um identificador vazio.
 *
 * O Plantio que a API devolve só tem identificadores. Quem os troca por nome é o catálogo
 * do contexto, que já está em memória para os campos de escolha.
 */
export function PlantiosDaPropriedade({ propriedadeId }: Props) {
  const { culturas, safras, excluirPlantio, versao } = useCadastro();
  const buscar = useCallback(
    (pagina: number) => listarPlantiosDaPropriedade(propriedadeId, pagina, TAMANHO_DA_PAGINA),
    [propriedadeId],
  );
  const fatia = useFatia(buscar, versao);
  const [recusa, setRecusa] = useState<string>();

  function nomeDaCultura(culturaId: string): string {
    return culturas.find((cultura) => cultura.id === culturaId)?.nome ?? DESCONHECIDO;
  }

  function anoDaSafra(safraId: string): string {
    const safra = safras.find((candidata) => candidata.id === safraId);

    return safra === undefined ? DESCONHECIDO : String(safra.ano);
  }

  async function excluir(id: string): Promise<void> {
    setRecusa(undefined);

    try {
      await excluirPlantio(id);
    } catch (causa: unknown) {
      setRecusa(mensagemDe(causa));
    }
  }

  if (fatia.carregando) {
    return <p role="status">Carregando os Plantios…</p>;
  }

  if (fatia.erro !== undefined) {
    return <p role="alert">{fatia.erro}</p>;
  }

  return (
    <>
      {recusa !== undefined && <p role="alert">{recusa}</p>}
      {fatia.itens.length === 0 ? (
        <p className="vazio">{VAZIO}</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">Cultura</th>
              <th scope="col">Safra</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fatia.itens.map((plantio) => {
              const cultura = nomeDaCultura(plantio.culturaId);
              const safra = anoDaSafra(plantio.safraId);

              return (
                <tr key={plantio.id}>
                  <td>{cultura}</td>
                  <td>{safra}</td>
                  <td className="acoes">
                    <BotaoDeExclusao
                      rotulo={`Excluir ${cultura} em ${safra}`}
                      pergunta={`Excluir o Plantio de ${cultura} em ${safra}?`}
                      aoConfirmar={() => {
                        void excluir(plantio.id);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Paginacao pagina={fatia.pagina} paginas={fatia.paginas} irPara={fatia.irPara} />
    </>
  );
}
