import type { ReactNode } from 'react';
import { useId } from 'react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { formatarParticipacao, formatarQuantidade } from '../formato';

/** Uma fatia da pizza: o rótulo e o número que ela representa. */
export interface Fatia {
  nome: string;
  valor: number;
}

interface Props {
  titulo: string;
  fatias: Fatia[];
  /** O que a tela diz quando não há o que desenhar. Gráfico em branco sem explicação, não. */
  vazio: string;
  /** Como cada valor é escrito na legenda. Contagem por padrão, hectares no Uso do Solo. */
  formatarValor?: (valor: number) => string;
  /** Controle que pertence a este gráfico, como o filtro de Safra. */
  controle?: ReactNode;
  /** Recado momentâneo, como a falha de um recorte que não derruba a tela inteira. */
  aviso?: string;
}

const CORES = ['#2f7d32', '#f9a825', '#1565c0', '#6a1b9a', '#c62828', '#00838f', '#4e342e'];

const TAMANHO_DO_GRAFICO = { largura: 260, altura: 220 };

export function GraficoDePizza({
  titulo,
  fatias,
  vazio,
  formatarValor = formatarQuantidade,
  controle,
  aviso,
}: Props) {
  const tituloId = useId();
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  // Uma lista sem fatias e uma lista só de zeros dão a mesma pizza: nenhuma.
  const temOQueDesenhar = total > 0;

  return (
    <section className="cartao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>{titulo}</h2>
      {controle}
      {aviso !== undefined && (
        <p className="aviso" role="status">
          {aviso}
        </p>
      )}
      {temOQueDesenhar ? (
        <>
          <PieChart
            width={TAMANHO_DO_GRAFICO.largura}
            height={TAMANHO_DO_GRAFICO.altura}
            role="img"
            aria-label={`Gráfico de pizza: ${titulo}`}
          >
            <Pie data={fatias} dataKey="valor" nameKey="nome" outerRadius={80} isAnimationActive={false}>
              {fatias.map((fatia, indice) => (
                <Cell key={fatia.nome} fill={CORES[indice % CORES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(valor) => formatarValor(Number(valor))} />
          </PieChart>
          {/* A legenda repete os números em texto: é o que o leitor de tela lê, e é onde
              o teste olha, porque o desenho em SVG não se afirma. */}
          <ul className="legenda">
            {fatias.map((fatia, indice) => (
              <li key={fatia.nome}>
                <span className="marca" style={{ background: CORES[indice % CORES.length] }} aria-hidden="true" />
                <span className="rotulo">{fatia.nome}</span>
                <span className="valor">
                  {formatarValor(fatia.valor)} ({formatarParticipacao(fatia.valor, total)})
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
