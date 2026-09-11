import type { Safra } from '@cadastro-rural/contracts';
import { useId } from 'react';
import { TODAS_AS_SAFRAS } from './usePainel';

interface Props {
  safras: Safra[];
  safraId: string;
  aoEscolher: (safraId: string) => void;
}

/**
 * O filtro de Safra.
 *
 * Ele mora junto do gráfico de Cultura, e não no topo da tela, porque é o único número
 * que ele recorta. No topo, ele pareceria valer para os totais também.
 */
export function ControleDeSafra({ safras, safraId, aoEscolher }: Props) {
  const campoId = useId();

  return (
    <p className="controle">
      <label htmlFor={campoId}>Safra</label>
      <select
        id={campoId}
        value={safraId}
        onChange={(evento) => {
          aoEscolher(evento.target.value);
        }}
      >
        <option value={TODAS_AS_SAFRAS}>Todas</option>
        {safras.map((safra) => (
          <option key={safra.id} value={safra.id}>
            {safra.ano}
          </option>
        ))}
      </select>
    </p>
  );
}
