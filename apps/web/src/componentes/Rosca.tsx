import type { ReactNode } from 'react';
import { useId } from 'react';
import { formatarParticipacao, formatarQuantidade } from '../formato';

/** Uma fatia da rosca: o rótulo e o número que ela representa. */
export interface Fatia {
  nome: string;
  valor: number;
}

/** O número grande no furo da rosca, e o que ele conta. */
export interface Centro {
  numero: string;
  unidade: string;
}

interface Props {
  titulo: string;
  fatias: Fatia[];
  centro: Centro;
  /**
   * O inteiro contra o qual as fatias se medem, quando ele é maior do que a soma delas.
   *
   * O Uso do Solo é o caso: a Área Agricultável e a de Vegetação repartem a Área Total,
   * mas podem não cobri-la inteira. Sem isto, duas fatias que somam menos do que o total
   * seriam desenhadas como se somassem cem por cento, e o que sobra sumiria da tela.
   */
  total?: number;
  /** O que a tela diz quando não há o que desenhar. Gráfico em branco sem explicação, não. */
  vazio: string;
  /** Como cada valor é escrito na legenda. Contagem por padrão, hectares no Uso do Solo. */
  formatarValor?: (valor: number) => string;
  /** Controle que pertence a este gráfico, como o filtro de Safra. */
  controle?: ReactNode;
  /** Recado momentâneo, como a falha de um recorte que não derruba a tela inteira. */
  aviso?: string;
}

const CORES = ['#2f7d32', '#f9a825', '#1565c0', '#6a1b9a', '#00838f', '#ad1457'] as const;

/** A paleta se repete quando há mais fatias do que cores. */
function corDa(indice: number): string {
  return CORES[indice % CORES.length] ?? CORES[0];
}

/** O raio do traço, na mesma escala do `viewBox`. A circunferência sai dele. */
const RAIO = 56;
const VOLTA = 2 * Math.PI * RAIO;

/** Acima disto o número não cabe no furo no corpo grande, e desce um degrau. */
const CARACTERES_QUE_CABEM = 4;

interface Arco {
  nome: string;
  cor: string;
  /** Quanto do traço é tinta e quanto é vão, somando uma volta. */
  tracejado: string;
  /** Onde o arco começa. Negativo porque o traço corre no sentido do desenho. */
  recuo: string;
}

/**
 * As fatias viradas arcos de uma volta só.
 *
 * Um arco é um círculo inteiro com o traço interrompido: a parte pintada é a fatia, e o
 * recuo empurra o começo dela para onde a anterior terminou. Sai mais barato do que
 * calcular caminhos, e é o que permite desenhar a rosca sem biblioteca de gráfico.
 */
function arcos(fatias: Fatia[], total: number): Arco[] {
  let percorrido = 0;

  return fatias.map((fatia, indice) => {
    const fracao = fatia.valor / total;
    const tinta = fracao * VOLTA;
    const recuo = -percorrido * VOLTA;

    percorrido += fracao;

    return {
      nome: fatia.nome,
      cor: corDa(indice),
      tracejado: `${tinta.toFixed(2)} ${(VOLTA - tinta).toFixed(2)}`,
      recuo: recuo.toFixed(2),
    };
  });
}

/**
 * Uma distribuição, como rosca e como texto.
 *
 * O desenho não se afirma para quem não o vê, então a legenda repete cada fatia com o
 * número e a participação dela: é o que o leitor de tela lê, e é onde o teste olha. A
 * barrinha sob cada linha é a mesma participação de novo, para que a comparação entre
 * fatias não dependa de comparar ângulos.
 */
export function Rosca({
  titulo,
  fatias,
  centro,
  total,
  vazio,
  formatarValor = formatarQuantidade,
  controle,
  aviso,
}: Props) {
  const tituloId = useId();
  const soma = fatias.reduce((acumulado, fatia) => acumulado + fatia.valor, 0);
  // Um inteiro menor do que as fatias faria os arcos passarem da volta. Nesse caso, e
  // quando ninguém informa um, o inteiro é a soma delas.
  const inteiro = total !== undefined && total > soma ? total : soma;
  // Uma lista sem fatias e uma lista só de zeros dão a mesma rosca: nenhuma.
  const temOQueDesenhar = soma > 0;

  return (
    <section className="cartao" aria-labelledby={tituloId}>
      <div className="grafico-cabeca">
        <h2 id={tituloId}>{titulo}</h2>
        {controle}
      </div>
      {aviso !== undefined && (
        <p className="aviso" role="status">
          {aviso}
        </p>
      )}
      {temOQueDesenhar ? (
        <>
          <div className="rosca">
            <div className="rosca-moldura">
              <svg
                width="150"
                height="150"
                viewBox="0 0 128 128"
                role="img"
                aria-label={`Gráfico: ${titulo}`}
              >
                {/* O trilho por baixo fecha a volta quando as fatias não a fecham. */}
                <circle cx="64" cy="64" r={RAIO} fill="none" stroke="#eef1ef" strokeWidth="14" />
                {arcos(fatias, inteiro).map((arco) => (
                  <circle
                    key={arco.nome}
                    cx="64"
                    cy="64"
                    r={RAIO}
                    fill="none"
                    stroke={arco.cor}
                    strokeWidth="14"
                    strokeDasharray={arco.tracejado}
                    strokeDashoffset={arco.recuo}
                    // Sem isto a volta começaria às três horas, e não ao meio-dia.
                    transform="rotate(-90 64 64)"
                  />
                ))}
              </svg>
              {/* O número já está na legenda: aqui ele é enfeite, e o leitor de tela o pula. */}
              <div className="rosca-centro" aria-hidden="true">
                <span
                  className={
                    centro.numero.length > CARACTERES_QUE_CABEM ? 'numero longo' : 'numero'
                  }
                >
                  {centro.numero}
                </span>
                <span className="unidade">{centro.unidade}</span>
              </div>
            </div>
          </div>
          <ul className="legenda">
            {fatias.map((fatia, indice) => (
              <li key={fatia.nome}>
                <span
                  className="marca"
                  style={{ background: corDa(indice) }}
                  aria-hidden="true"
                />
                <span className="rotulo">{fatia.nome}</span>
                <span className="valor">
                  <strong>{formatarValor(fatia.valor)}</strong> ·{' '}
                  {formatarParticipacao(fatia.valor, inteiro)}
                </span>
                <span className="barra" aria-hidden="true">
                  <span
                    style={{
                      width: `${String((fatia.valor / inteiro) * 100)}%`,
                      background: corDa(indice),
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="vazio">{vazio}</p>
      )}
    </section>
  );
}
