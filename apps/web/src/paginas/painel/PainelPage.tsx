import { GraficoDePizza } from '../../componentes/GraficoDePizza';
import { Totais } from '../../componentes/Totais';
import { formatarHectares } from '../../formato';
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
 * O que o cartão da Cultura diz quando não há pizza.
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

  return (
    <>
      <h1>Painel</h1>
      <Totais propriedades={painel.totais.propriedades} areaTotal={painel.totais.areaTotal} />
      <div className="graficos">
        <GraficoDePizza
          titulo="Propriedades por estado"
          fatias={painel.propriedadesPorEstado.map((linha) => ({
            nome: linha.estado,
            valor: linha.propriedades,
          }))}
          vazio={SEM_PROPRIEDADE}
        />
        <GraficoDePizza
          titulo="Plantios por Cultura"
          fatias={(porCultura ?? []).map((linha) => ({
            nome: linha.cultura,
            valor: linha.plantios,
          }))}
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
        <GraficoDePizza
          titulo="Uso do solo"
          fatias={[
            { nome: 'Área agricultável', valor: painel.usoDoSolo.areaAgricultavel },
            { nome: 'Área de vegetação', valor: painel.usoDoSolo.areaDeVegetacao },
          ]}
          vazio={SEM_AREA}
          formatarValor={formatarHectares}
        />
      </div>
    </>
  );
}
