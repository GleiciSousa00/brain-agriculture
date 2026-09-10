import request from 'supertest';
import { comAplicacao, executar } from './aplicacao';
import {
  PRODUTORES_DE_EXEMPLO,
  SAFRAS_DE_EXEMPLO,
  TAMANHO_DO_EXEMPLO,
  type PropriedadeDeExemplo,
} from './dados-de-exemplo';

/** O servidor HTTP da aplicação, que é o que o supertest aceita. */
type Servidor = Parameters<typeof request>[0];

interface RespostaHttp {
  status: number;
  body: unknown;
  text: string;
}

interface ComIdentificador {
  id: string;
}

interface CulturaDoCatalogo extends ComIdentificador {
  nome: string;
}

interface SafraCadastrada extends ComIdentificador {
  ano: number;
}

export interface ResumoDaCarga {
  produtores: number;
  propriedades: number;
  plantios: number;
  safras: number;
}

/**
 * Insere o conjunto de dados de exemplo pela API.
 *
 * Entra pela API, e não por SQL, de propósito: assim a carga percorre a validação do
 * Documento, a regra da soma das áreas e a cifra em repouso. Um conjunto de exemplo que só
 * entra por SQL pode ser um conjunto que a aplicação recusaria, e ninguém descobriria.
 *
 * A função é exportada porque o teste de integração do painel carrega o mesmo conjunto pelo
 * mesmo caminho. É isso que faz os números conferidos à mão lá valerem para o que a
 * operadora vê aqui.
 */

export async function carregarDadosDeExemplo(servidor: Servidor): Promise<ResumoDaCarga> {
  const culturas = await catalogoPorNome(servidor);
  const safras = await safrasPorAno(servidor);

  for (const produtor of PRODUTORES_DE_EXEMPLO) {
    const { id: produtorId } = await enviar<ComIdentificador>(
      request(servidor).post('/produtores').send({
        documento: produtor.documento,
        nome: produtor.nome,
      }),
      201,
      `o Produtor ${produtor.nome}`,
    );

    for (const propriedade of produtor.propriedades) {
      await carregarPropriedade(servidor, produtorId, propriedade, culturas, safras);
    }
  }

  return { ...TAMANHO_DO_EXEMPLO };
}

async function carregarPropriedade(
  servidor: Servidor,
  produtorId: string,
  propriedade: PropriedadeDeExemplo,
  culturas: Map<string, string>,
  safras: Map<number, string>,
): Promise<void> {
  const { id: propriedadeId } = await enviar<ComIdentificador>(
    request(servidor)
      .post('/propriedades')
      .send({
        produtorId,
        cidade: propriedade.cidade,
        estado: propriedade.estado,
        areaTotal: propriedade.areaTotal,
        areaAgricultavel: propriedade.areaAgricultavel,
        areaDeVegetacao: propriedade.areaDeVegetacao,
      }),
    201,
    `a Propriedade em ${propriedade.cidade}`,
  );

  for (const plantio of propriedade.plantios) {
    await enviar(
      request(servidor).post('/plantios').send({
        propriedadeId,
        culturaId: exigir(culturas, plantio.cultura, 'Cultura'),
        safraId: exigir(safras, plantio.ano, 'Safra'),
      }),
      201,
      `o Plantio de ${plantio.cultura} em ${propriedade.cidade}`,
    );
  }
}

/** O catálogo já vem semeado pela migração. A carga procura o identificador pelo nome. */
async function catalogoPorNome(servidor: Servidor): Promise<Map<string, string>> {
  const catalogo = await enviar<CulturaDoCatalogo[]>(
    request(servidor).get('/culturas'),
    200,
    'o catálogo de Cultura',
  );

  return new Map(catalogo.map((cultura) => [cultura.nome, cultura.id]));
}

/** Cria as Safras que faltarem, e reaproveita as que já existem. */
async function safrasPorAno(servidor: Servidor): Promise<Map<number, string>> {
  const cadastradas = await enviar<SafraCadastrada[]>(
    request(servidor).get('/safras'),
    200,
    'a lista de Safra',
  );
  const porAno = new Map(cadastradas.map((safra) => [safra.ano, safra.id]));

  for (const ano of SAFRAS_DE_EXEMPLO) {
    if (porAno.has(ano)) {
      continue;
    }

    const criada = await enviar<SafraCadastrada>(
      request(servidor).post('/safras').send({ ano }),
      201,
      `a Safra de ${ano}`,
    );
    porAno.set(ano, criada.id);
  }

  return porAno;
}

function exigir<C>(onde: Map<C, string>, chave: C, oQue: string): string {
  const encontrado = onde.get(chave);

  if (encontrado === undefined) {
    throw new Error(`O conjunto de exemplo cita a ${oQue} "${String(chave)}", que não existe.`);
  }

  return encontrado;
}

/**
 * Confere o status de cada resposta e devolve o corpo já tipado.
 *
 * A mensagem de falha traz o detalhe do Problem Details. Sem ele, uma carga que morre no
 * meio diz apenas o número do status, e quem está com o comando na mão não sabe se o que
 * quebrou foi o Documento, a soma das áreas ou a ligação do Plantio.
 */
async function enviar<T>(
  pedido: PromiseLike<RespostaHttp>,
  esperado: number,
  oQue: string,
): Promise<T> {
  const resposta = await pedido;

  if (resposta.status !== esperado) {
    throw new Error(
      `A carga de exemplo parou em ${oQue}: a API respondeu ${resposta.status}. ${detalhe(resposta)}`,
    );
  }

  return resposta.body as T;
}

function detalhe({ body, text }: RespostaHttp): string {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    return String((body as { detail: unknown }).detail);
  }

  return text;
}

/** Quantos Produtores já existem, para a carga não repetir o que já está lá. */
async function jaTemCadastro(servidor: Servidor): Promise<boolean> {
  const pagina = await enviar<{ total: number }>(
    request(servidor).get('/produtores').query({ tamanho: 1 }),
    200,
    'a lista de Produtor',
  );

  return pagina.total > 0;
}

// O teste de integração importa a função acima, e importar não pode carregar nada. O
// comando só corre quando este arquivo é o que foi chamado.
if (require.main === module) {
  executar(async () => {
    await comAplicacao(async (app) => {
      const servidor = app.getHttpServer() as Servidor;

      if (await jaTemCadastro(servidor)) {
        console.log('A base já tem Produtor cadastrado. Nada a fazer.');
        return;
      }

      const resumo = await carregarDadosDeExemplo(servidor);

      console.log(
        `Carga de exemplo: ${resumo.produtores} Produtores, ${resumo.propriedades} Propriedades, ` +
          `${resumo.plantios} Plantios em ${resumo.safras} Safras.`,
      );
    });
  });
}
