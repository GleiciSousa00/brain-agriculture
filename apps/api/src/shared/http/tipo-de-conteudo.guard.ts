import {
  Injectable,
  UnsupportedMediaTypeException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { SO_ACEITA_JSON } from './problem-details';

const METODOS_COM_CORPO = new Set(['POST', 'PUT', 'PATCH']);

const TIPO_ACEITO = 'application/json';

/** Requisição sem corpo nenhum não tem tipo de conteúdo a conferir. */
function temCorpo(request: Request): boolean {
  return (
    Number(request.headers['content-length'] ?? 0) > 0 ||
    request.headers['transfer-encoding'] !== undefined
  );
}

/**
 * Corpo que não é JSON é recusado com 415, e não com 400.
 *
 * O interpretador de corpo do Express ignora em silêncio o que não seja `application/json`
 * e entrega corpo vazio. Sem esta conferência, quem manda um formulário ou um XML recebe
 * a lista de campos obrigatórios faltando, quando o problema é o tipo de conteúdo.
 */
@Injectable()
export class TipoDeConteudoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!METODOS_COM_CORPO.has(request.method) || !temCorpo(request)) {
      return true;
    }

    if (request.is(TIPO_ACEITO) === false) {
      throw new UnsupportedMediaTypeException(SO_ACEITA_JSON);
    }

    return true;
  }
}
