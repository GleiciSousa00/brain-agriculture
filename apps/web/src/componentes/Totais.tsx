import { formatarArea, formatarQuantidade } from '../formato';

interface Props {
  propriedades: number;
  areaTotal: number;
}

/** Os dois números que descrevem o tamanho da base inteira. */
export function Totais({ propriedades, areaTotal }: Props) {
  return (
    <dl className="totais">
      <div className="cartao">
        <dt>Propriedades cadastradas</dt>
        <dd>{formatarQuantidade(propriedades)}</dd>
      </div>
      <div className="cartao">
        <dt>Área total</dt>
        {/* A unidade é miúda ao lado do número: ela mede, e não é o que se lê primeiro. */}
        <dd>
          {formatarArea(areaTotal)} <span className="unidade">ha</span>
        </dd>
      </div>
    </dl>
  );
}
