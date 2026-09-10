import { Injectable, RequestMethod, type OnModuleInit } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';

/** O nome HTTP de cada método que os decoradores de rota registram. */
const NOME_DO_METODO: Partial<Record<RequestMethod, string>> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
};

interface Rota {
  /** O caminho quebrado em segmentos, com os de parâmetro guardados como `:id`. */
  segmentos: string[];
  metodo: string;
}

function segmentosDe(caminho: string): string[] {
  return caminho.split('/').filter((segmento) => segmento !== '');
}

/** Um segmento de parâmetro casa com qualquer valor; o resto tem de bater letra a letra. */
function casa(rota: Rota, segmentos: string[]): boolean {
  return (
    rota.segmentos.length === segmentos.length &&
    rota.segmentos.every(
      (segmento, indice) => segmento.startsWith(':') || segmento === segmentos[indice],
    )
  );
}

/**
 * As rotas que a API registrou, para separar caminho inexistente de método não permitido.
 *
 * Sem esta tabela as duas coisas saem como 404: quem pede `PATCH /produtores` recebe a
 * mesma resposta de quem pediu um caminho que não existe, e não tem como saber que o
 * caminho está certo e o método é que não.
 */
@Injectable()
export class RotasDaApi implements OnModuleInit {
  private readonly rotas: Rota[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  onModuleInit(): void {
    for (const { instance, metatype } of this.discovery.getControllers()) {
      if (typeof instance !== 'object' || instance === null || metatype === null || metatype === undefined) {
        continue;
      }

      this.registrar(instance, metatype);
    }
  }

  /** Os métodos que o caminho aceita. Vazio quer dizer que o caminho não existe. */
  metodosPara(caminho: string): string[] {
    const segmentos = segmentosDe(caminho);

    return this.rotas.filter((rota) => casa(rota, segmentos)).map((rota) => rota.metodo);
  }

  private registrar(instance: object, metatype: object): void {
    const base = segmentosDe(String(Reflect.getMetadata(PATH_METADATA, metatype) ?? ''));
    const prototype = Object.getPrototypeOf(instance) as object;

    for (const nome of this.scanner.getAllMethodNames(prototype)) {
      const handler = (prototype as Record<string, unknown>)[nome];
      const caminho = Reflect.getMetadata(PATH_METADATA, handler as object) as unknown;
      const metodo = NOME_DO_METODO[Reflect.getMetadata(METHOD_METADATA, handler as object) as RequestMethod];

      if (typeof caminho !== 'string' || metodo === undefined) {
        continue;
      }

      this.rotas.push({ segmentos: [...base, ...segmentosDe(caminho)], metodo });
    }
  }
}
