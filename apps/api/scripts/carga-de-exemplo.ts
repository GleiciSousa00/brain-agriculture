import { comAplicacao, rodarComando } from './aplicacao';
import { carregarDadosDeExemplo, jaTemCadastro, type Servidor } from './carregador-de-exemplo';

/**
 * O comando que enche a base com o cadastro de exemplo.
 *
 * Ele precisa do Postgres de pé, e de mais nada: a aplicação sobe em processo e roda as
 * migrações no arranque. Quem tem a composição no ar já tem o banco.
 *
 * O comando roda a partir do repositório, e não de dentro da imagem: a pasta de comandos
 * fica fora do que a imagem carrega, e a carga se apoia no supertest, que é dependência de
 * desenvolvimento.
 */
rodarComando(async () => {
  await comAplicacao(async (app) => {
    const servidor = app.getHttpServer() as Servidor;

    if (await jaTemCadastro(servidor)) {
      console.log(
        'A base já tem Produtor cadastrado, e a carga não sobrescreve o que existe. ' +
          'Para começar do zero, derrube a composição com `docker compose down --volumes`.',
      );
      return;
    }

    const resumo = await carregarDadosDeExemplo(servidor);

    console.log(
      `Carga de exemplo: ${resumo.produtores} Produtores, ${resumo.propriedades} Propriedades, ` +
        `${resumo.plantios} Plantios em ${resumo.safras} Safras.`,
    );
  });
});
