import { BadRequestException, Injectable, ParseUUIDPipe } from '@nestjs/common';

/**
 * O que se diz de um identificador que nem forma de identificador tem.
 *
 * Sem isto sai o texto cru do Nest, "Validation failed (uuid is expected)", num aplicativo
 * escrito inteiro em português — e ele chega inteiro à tela, porque a interface mostra o
 * `detail` que a API mandou, sem reescrita.
 */
const NAO_E_IDENTIFICADOR = 'O identificador informado não é um UUID.';

/**
 * O identificador que vem no caminho da rota.
 *
 * É o `ParseUUIDPipe` do Nest recusando em português, pelo mesmo motivo que levou o Zod a
 * recusar em português: a recusa é resposta ao operador, e não recado de biblioteca.
 */
@Injectable()
export class IdentificadorPipe extends ParseUUIDPipe {
  constructor() {
    super({ exceptionFactory: () => new BadRequestException(NAO_E_IDENTIFICADOR) });
  }
}
