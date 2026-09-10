import { createApiClient } from '@cadastro-rural/contracts';

/**
 * A tela chama a própria origem, e quem repassa para a API é o servidor: o nginx no
 * Docker, o Vite em desenvolvimento. Ver o registro 0009 em `docs/adr/`.
 */
export const ENDERECO_DA_API = `${window.location.origin}/api`;

/** O único caminho entre a interface e a API. Nada de `fetch` solto pelas telas. */
export const api = createApiClient(ENDERECO_DA_API);
