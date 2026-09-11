# A interface web usa react-router, Recharts e fala com a API na mesma origem

A interface web tem duas telas, painel e cadastro. Três escolhas estruturais ficam
registradas aqui porque nenhuma delas é evidente no código, e porque a segunda tela, que
chega noutro ticket, precisa herdá-las em vez de reinventá-las.

**Navegação: `react-router`, em modo declarativo.** `/painel` e `/cadastro` são endereços
de verdade, com `BrowserRouter` em `main.tsx` e as rotas em `App.tsx`. A raiz e qualquer
endereço desconhecido caem no painel.

**Gráfico: `recharts`.** Os três gráficos de pizza usam `PieChart` com tamanho fixo. A
legenda com os números não é a do Recharts: é uma lista escrita à mão, ao lado do desenho.
Esta escolha foi revista pelo registro
[`0011`](0011-cadastro-navegado-pela-hierarquia.md): o desenho passou a ser SVG escrito à
mão e o Recharts saiu do pacote. A legenda em texto continua como está.

**Teste: a interface web ganha Vitest com Testing Library.** Ela não tinha runner
nenhum: o script `test` era um `echo`. O portão de cobertura da issue 20 continua valendo
só em `domain` e `application` da API, e a interface não ganha barra de cobertura, porque
a regra de negócio não mora nela. O que os testes provam é o comportamento da tela.

**Endereço da API: a própria origem, sob `/api`.** O navegador nunca chama a porta da API
direto. Quem repassa é o servidor que entrega a tela: o Caddy no Docker, por
[`apps/web/Caddyfile`](../../apps/web/Caddyfile), e o Vite em desenvolvimento, por
`server.proxy`. Nas duas pontas o prefixo é cortado, então `/api/painel` chega na API como
`/painel`.

O servidor era nginx quando este registro foi escrito, e passou a ser Caddy quando o
sistema foi para uma VPS. O que decidiu a troca não foi preferência: o nginx resolvia o
nome da API uma vez, no arranque, e cortava o prefixo por uma regra escrita à parte que
podia divergir do bloco que a chamava. As duas armadilhas somem no Caddy, e a emissão de
certificado que a VPS precisava vinha junto. A decisão registrada aqui, a de origem única,
não mudou: mudou o servidor que a cumpre. O deploy em si não tem registro de decisão, de
propósito, e está em [`deploy/README.md`](../../deploy/README.md).

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
contrato que `Caddyfile` e `vite.config.ts` cumprem.

O roteador do navegador exige que o servidor devolva o `index.html` para endereço que não
é arquivo. É o `try_files {path} /index.html` do `Caddyfile`. O portão desse arquivo é o
CI construir a imagem da interface e mandar o próprio Caddy conferir a configuração, com
`caddy validate`.

O corte do prefixo é do `handle_path /api/*`, que tira `/api` por definição do bloco, e
não por uma regra escrita à parte que possa divergir dele. O nome da API dentro do
`reverse_proxy` é resolvido a cada requisição, e não uma vez no arranque: o Caddy sobe com
a API ainda fora do ar e a reencontra quando ela volta.

**São dois `Caddyfile`, e eles têm de concordar.** O da imagem, `apps/web/Caddyfile`,
escuta em `:80` sem TLS e sem senha, e é o que a composição de desenvolvimento usa. O de
produção, [`deploy/Caddyfile`](../../deploy/Caddyfile), é montado por cima dele e
acrescenta o domínio, o certificado e o basic auth. O repasse de `/api` e o `try_files`
estão escritos nos dois, então mexer num e esquecer o outro quebra a produção sem quebrar
o desenvolvimento. O CI valida os dois, e é só o que ele consegue afirmar: `caddy validate`
prova sintaxe, não prova que as duas rotas ainda são a mesma.

Recharts não desenha nada num ambiente sem tamanho, e o `jsdom` é um desses. Por isso o
gráfico tem tamanho fixo e a legenda em texto existe: é ela que o teste afirma, e é ela
que um leitor de tela lê. Com a saída do Recharts pelo registro `0011` a primeira parte
deixou de valer; a segunda continua, e é o motivo de a legenda nunca ter sido do desenho.
