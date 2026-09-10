# A interface web usa react-router, Recharts e fala com a API na mesma origem

A interface web tem duas telas, painel e cadastro. Três escolhas estruturais ficam
registradas aqui porque nenhuma delas é evidente no código, e porque a segunda tela, que
chega noutro ticket, precisa herdá-las em vez de reinventá-las.

**Navegação: `react-router`, em modo declarativo.** `/painel` e `/cadastro` são endereços
de verdade, com `BrowserRouter` em `main.tsx` e as rotas em `App.tsx`. A raiz e qualquer
endereço desconhecido caem no painel.

**Gráfico: `recharts`.** Os três gráficos de pizza usam `PieChart` com tamanho fixo. A
legenda com os números não é a do Recharts: é uma lista escrita à mão, ao lado do desenho.

**Teste: a interface web ganha Vitest com Testing Library.** Ela não tinha runner
nenhum: o script `test` era um `echo`. O portão de cobertura da issue 20 continua valendo
só em `domain` e `application` da API, e a interface não ganha barra de cobertura, porque
a regra de negócio não mora nela. O que os testes provam é o comportamento da tela.

**Endereço da API: a própria origem, sob `/api`.** O navegador nunca chama a porta da API
direto. Quem repassa é o servidor que entrega a tela: o nginx no Docker, por
`apps/web/nginx.conf`, e o Vite em desenvolvimento, por `server.proxy`. Nas duas pontas a
barra final do destino corta o prefixo, então `/api/painel` chega na API como `/painel`.

A tela de cadastro existe como andaime desde já, com uma frase e nada mais. Ela é da
issue 11, mas o menu precisa de dois destinos para que a navegação seja navegação, e um
item de menu que não leva a lugar nenhum mente para quem clica.

## Considered Options

**Navegação sem biblioteca**, uma troca de tela por estado, foi considerada: são só duas
telas. Foi rejeitada porque a tela deixaria de ter endereço próprio, e recarregar a página
ou compartilhar o link do cadastro deixaria de funcionar.

**SVG escrito à mão** no lugar do Recharts pouparia duas dependências, e **Chart.js** foi
a outra candidata. O canvas do Chart.js foi rejeitado por ser opaco para teste e para
leitor de tela. O SVG à mão foi rejeitado porque rótulo, cor e proporção viram trabalho
manual em três lugares.

**Nenhum teste na interface** foi considerado: a issue 12 não os pede nos critérios, e a
barra de cobertura não alcança `apps/web`. Foi rejeitado porque as regras que a tela tem
de cumprir, como o recorte por Safra tocar um gráfico só e a base vazia não render gráfico
em branco, não se provam em lugar nenhum senão nela.

**Variável de build do Vite**, um `VITE_API_URL` lido em tempo de compilação, é o caminho
mais comum e foi rejeitado por dois motivos. O primeiro é que a API não habilita CORS:
uma chamada de `localhost:5173` para `localhost:3000` seria recusada pelo navegador, e
fazê-la funcionar exigiria mexer na API. O segundo é que o endereço ficaria cozido dentro
do pacote estático, então trocar de ambiente passaria a exigir reconstruir a imagem.

## Consequences

A API continua sem CORS, e é assim que se pretende que fique: não há origem cruzada para
autorizar. Quem servir a interface por outro caminho precisa repassar `/api`, e esse é o
contrato que `nginx.conf` e `vite.config.ts` cumprem.

O roteador do navegador exige que o servidor devolva o `index.html` para endereço que não
é arquivo. É o `try_files` do `nginx.conf`; apagá-lo quebra o recarregamento das telas
internas sem quebrar teste nenhum.

Recharts não desenha nada num ambiente sem tamanho, e o `jsdom` é um desses. Por isso o
gráfico tem tamanho fixo e a legenda em texto existe: é ela que o teste afirma, e é ela
que um leitor de tela lê. Um gráfico que passe a depender de `ResponsiveContainer` fica
invisível para os dois.
