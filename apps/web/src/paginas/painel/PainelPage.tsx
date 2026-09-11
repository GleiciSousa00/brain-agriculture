import { Rosca } from '../../componentes/Rosca';
import { Totais } from '../../componentes/Totais';
import { formatarArea, formatarHectares, formatarQuantidade } from '../../formato';
import { ControleDeSafra } from './ControleDeSafra';
import { TODAS_AS_SAFRAS, usePainel } from './usePainel';

const SEM_PROPRIEDADE = 'Nenhuma Propriedade cadastrada ainda.';
const SEM_PLANTIO = 'Nenhum Plantio registrado ainda.';
const SEM_PLANTIO_NA_SAFRA = 'Nenhum Plantio registrado nesta Safra.';
const SEM_AREA = 'Nenhuma área informada ainda.';
const RECORTANDO = 'Recortando pela Safra…';
const RECORTE_NAO_VEIO = 'Sem distribuição para mostrar.';

interface EstadoDaCultura {
  recortando: boolean;
  falhou: boolean;
  safraId: string;
}

/**
 * O que o cartão da Cultura diz quando não há rosca.
 *
 * São quatro situações diferentes, e nenhuma delas pode virar gráfico em branco: o
 * recorte em voo, o recorte que falhou, a base sem Plantio nenhum, e a Safra sem Plantio.
 */
function textoVazioDaCultura({ recortando, falhou, safraId }: EstadoDaCultura): string {
  if (recortando) {
    return RECORTANDO;
  }

  if (falhou) {
    return RECORTE_NAO_VEIO;
  }

  return safraId === TODAS_AS_SAFRAS ? SEM_PLANTIO : SEM_PLANTIO_NA_SAFRA;
}

export function PainelPage() {
  const {
    painel,
    porCultura,
    safras,
    safraId,
    escolherSafra,
    carregando,
    recortando,
    erro,
    erroDoRecorte,
  } = usePainel();

  if (carregando) {
    return <p role="status">Carregando o painel…</p>;
  }

  if (painel === undefined) {
    return <p role="alert">{erro}</p>;
  }

  const plantios = (porCultura ?? []).reduce((soma, linha) => soma + linha.plantios, 0);

  return (
    <>
      <h1>Painel</h1>
      <Totais propriedades={painel.totais.propriedades} areaTotal={painel.totais.areaTotal} />
      <div className="graficos">
        <Rosca
          titulo="Propriedades por estado"
          fatias={painel.propriedadesPorEstado.map((linha) => ({
            nome: linha.estado,
            valor: linha.propriedades,
          }))}
          centro={{
            numero: formatarQuantidade(painel.totais.propriedades),
            unidade: 'propriedades',
          }}
          vazio={SEM_PROPRIEDADE}
        />
        <Rosca
          titulo="Plantios por Cultura"
          fatias={(porCultura ?? []).map((linha) => ({
            nome: linha.cultura,
            valor: linha.plantios,
          }))}
          // O que o furo conta é o recorte em tela, e não a base inteira: o filtro de
          // Safra está logo ao lado, e um número que o ignorasse contradiria as fatias.
          centro={{ numero: formatarQuantidade(plantios), unidade: 'plantios' }}
          vazio={textoVazioDaCultura({
            recortando,
            falhou: erroDoRecorte !== undefined,
            safraId,
          })}
          controle={
            <ControleDeSafra safras={safras} safraId={safraId} aoEscolher={escolherSafra} />
          }
          aviso={erroDoRecorte}
        />
        <Rosca
          titulo="Uso do solo"
          fatias={[
            { nome: 'Área agricultável', valor: painel.usoDoSolo.areaAgricultavel },
            { nome: 'Área de vegetação', valor: painel.usoDoSolo.areaDeVegetacao },
          ]}
          // As duas fatias repartem a Área Total, e podem não cobri-la inteira. Medi-las
          // contra ela deixa o vão à mostra na rosca, em vez de fechar a volta com duas
          // fatias que somam menos do que o número escrito no furo.
          total={painel.totais.areaTotal}
          centro={{ numero: formatarArea(painel.totais.areaTotal), unidade: 'hectares' }}
          vazio={SEM_AREA}
          formatarValor={formatarHectares}
        />
      </div>
    </>
  );
}
