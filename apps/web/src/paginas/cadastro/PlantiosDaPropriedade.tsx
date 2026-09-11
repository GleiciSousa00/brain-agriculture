import { useState } from 'react';
import { Link } from 'react-router';
import { listarPlantiosDaPropriedade } from '../../api/plantios';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Escolha, NADA_ESCOLHIDO } from '../../componentes/Escolha';
import { useCadastro } from './CadastroContexto';
import { CATALOGOS, useEsquecerAbertura } from './hierarquia';
import { Listagem } from './Listagem';
import { useTentativa } from './useTentativa';

const CARREGANDO = 'Carregando os Plantios…';
const VAZIO = 'Nenhum Plantio registrado nesta Propriedade ainda.';
const FALTA_CATALOGO = 'Falta Cultura ou Safra no catálogo.';

interface Props {
  propriedadeId: string;
  /**
   * O nome dela, quando o catálogo o alcança.
   *
   * Passando do centésimo registro o catálogo não traz a Propriedade, e ainda assim os
   * Plantios dela são listáveis: a rota que os busca pede o identificador, não o nome.
   */
  nome?: string;
  /** Chegou-se aqui pedindo para registrar, e não só para ver. */
  abrindo: boolean;
}

/**
 * Os Plantios de uma Propriedade, com o formulário que os registra.
 *
 * Ela é um componente à parte porque tudo aqui só existe a partir de uma Propriedade:
 * enquanto não há uma escolhida, não há o que buscar, e um gancho que buscasse assim
 * mesmo pediria a rota de um identificador vazio.
 *
 * O Plantio que a API devolve só tem identificadores. Quem os troca por nome é o catálogo
 * do contexto, que já está em memória para os campos de escolha.
 */
export function PlantiosDaPropriedade({ propriedadeId, nome, abrindo }: Props) {
  const { culturas, safras, nomeDaCultura, anoDaSafra, registrarPlantio, excluirPlantio } =
    useCadastro();

  const esquecerAbertura = useEsquecerAbertura();
  const [aberto, setAberto] = useState(abrindo);
  const [culturaId, setCulturaId] = useState(NADA_ESCOLHIDO);
  const [safraId, setSafraId] = useState(NADA_ESCOLHIDO);
  const tentativaDoFormulario = useTentativa();
  const tentativaDaExclusao = useTentativa();

  /** Só o estado do formulário. O desfecho da última escrita sobrevive ao fechamento. */
  function esvaziar(): void {
    setAberto(false);
    setCulturaId(NADA_ESCOLHIDO);
    setSafraId(NADA_ESCOLHIDO);
    esquecerAbertura();
  }

  function fechar(): void {
    esvaziar();
    tentativaDoFormulario.limpar();
  }

  /** A unicidade da trinca é regra da API. A tela repete o que ela respondeu. */
  async function enviar(): Promise<void> {
    const passou = await tentativaDoFormulario.tentar(
      () => registrarPlantio({ propriedadeId, culturaId, safraId }),
      `Plantio de ${nomeDaCultura(culturaId)} em ${anoDaSafra(safraId)} registrado.`,
    );

    if (passou) {
      esvaziar();
    }
  }

  async function excluir(id: string, cultura: string, safra: string): Promise<void> {
    await tentativaDaExclusao.tentar(
      () => excluirPlantio(id),
      `Plantio de ${cultura} em ${safra} excluído.`,
    );
  }

  // Sem uma Cultura e uma Safra no catálogo não há trinca a formar, e os dois campos de
  // escolha nasceriam vazios sem dizer por quê.
  const faltaCatalogo = culturas.length === 0 || safras.length === 0;

  return (
    <div className="secao">
      {aberto && (
        <form
          className="cartao formulario"
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
          {faltaCatalogo && (
            <p className="largura-inteira ajuda">
              {FALTA_CATALOGO} <Link to={CATALOGOS}>Ir para Culturas e Safras</Link>
            </p>
          )}
          {tentativaDoFormulario.recusa !== undefined && (
            <p className="largura-inteira" role="alert">
              {tentativaDoFormulario.recusa}
            </p>
          )}
          <p className="acoes largura-inteira">
            <button type="submit">Registrar</button>
            <button type="button" onClick={fechar}>
              Cancelar
            </button>
          </p>
        </form>
      )}

      {tentativaDaExclusao.recusa !== undefined && (
        <p role="alert">{tentativaDaExclusao.recusa}</p>
      )}

      {/*
        Os dois avisos ficam fora do formulário porque ele some quando a escrita passa.
        Aqui eles são o que mais importa: a lista vem do mais novo para o mais antigo, mas
        a Propriedade com muitos Plantios ainda tem páginas, e a linha nova não prova nada
        a quem está na terceira delas.
      */}
      {tentativaDoFormulario.aviso !== undefined && (
        <p className="acerto" role="status">
          {tentativaDoFormulario.aviso}
        </p>
      )}

      {tentativaDaExclusao.aviso !== undefined && (
        <p className="acerto" role="status">
          {tentativaDaExclusao.aviso}
        </p>
      )}

      <Listagem
        titulo={nome === undefined ? 'Plantios da Propriedade' : `Plantios de ${nome}`}
        acoes={
          !aberto && (
            <button
              type="button"
              className="abridor"
              onClick={() => {
                setAberto(true);
              }}
            >
              Novo Plantio
            </button>
          )
        }
        listar={(pagina, tamanho) => listarPlantiosDaPropriedade(propriedadeId, pagina, tamanho)}
        carregando={CARREGANDO}
        vazio={VAZIO}
      >
        {(plantios) => (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Cultura</th>
                <th scope="col">Safra</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plantios.map((plantio) => {
                const cultura = nomeDaCultura(plantio.culturaId);
                const safra = anoDaSafra(plantio.safraId);

                return (
                  <tr key={plantio.id}>
                    <td>{cultura}</td>
                    <td className="tabular">{safra}</td>
                    <td className="acoes">
                      <BotaoDeExclusao
                        rotulo={`Excluir ${cultura} em ${safra}`}
                        pergunta={`Excluir o Plantio de ${cultura} em ${safra}?`}
                        aoConfirmar={() => {
                          void excluir(plantio.id, cultura, safra);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Listagem>
    </div>
  );
}
