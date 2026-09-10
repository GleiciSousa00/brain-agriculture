# Cadastro Rural

Cadastro de produtores rurais, suas propriedades e o que cada propriedade planta em cada
safra, com um painel de totais e distribuições. O glossário do domínio está em
[`CONTEXT.md`](CONTEXT.md) e as decisões de arquitetura em [`docs/adr`](docs/adr).

> Este ticket entrega o chão: monorepo, imagem Docker, composição, log com identificador
> de correlação, formato único de erro e pipeline. As regras de negócio chegam nos
> próximos.

## Subir tudo com um comando

Requisito: Docker com Compose.

```bash
docker compose up --build
```

Sobem três serviços: Postgres 17, a API e a interface web. A API só arranca depois que o
banco aceita conexão. Não é preciso criar `.env`: toda variável tem valor padrão, e
[`.env.example`](.env.example) lista o que dá para trocar.

| Serviço | Endereço |
|---|---|
| API | http://localhost:3000 |
| Rota de saúde | http://localhost:3000/health |
| Interface web | http://localhost:5173 |
| Especificação navegável | http://localhost:3000/docs |

A rota de saúde responde sem tocar em nenhuma tabela do cadastro: ela manda um `SELECT 1`
no banco e mais nada. As migrações rodam no arranque da API, então o banco sobe pronto.

## O Documento

O CPF ou CNPJ de um Produtor é dado pessoal e nunca é gravado em claro. A tabela guarda
duas colunas derivadas dele: o valor cifrado em AES-256-GCM, para exibição, e um HMAC-SHA-256
com segredo da aplicação, que é onde a restrição de unicidade pode existir. A cifra usa
nonce aleatório, então o mesmo Documento vira bytes diferentes a cada gravação, e é por
isso que a unicidade não pode se apoiar nela. A API devolve o Documento sempre mascarado e
o log tem regra de redação para o campo. Ver
[`docs/adr/0002-documento-cifrado-em-repouso.md`](docs/adr/0002-documento-cifrado-em-repouso.md).

A chave e o segredo chegam por variável de ambiente, sem valor padrão no código. A
composição traz valores de desenvolvimento para que um clone recém-feito suba com um
comando. Eles são públicos, e a API recusa arrancar com eles quando `NODE_ENV` é
`production`. [`.env.example`](.env.example) explica como gerar os seus.

A validação segue o código de referência da Receita Federal, não as bibliotecas de npm, e
diverge delas de propósito em dois pontos: um CNPJ com caracteres repetidos é válido, e um
CNPJ pode ter letras maiúsculas nas doze primeiras posições. Ver
[`docs/adr/0008-validacao-de-documento-segue-a-norma-da-receita.md`](docs/adr/0008-validacao-de-documento-segue-a-norma-da-receita.md).

## Desenvolver sem Docker

Requisitos: Node 24 (a versão está em [`.nvmrc`](.nvmrc)) e pnpm, que vem pelo Corepack.

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

Um Postgres precisa estar de pé. `docker compose up postgres` resolve, ou aponte as
variáveis de `POSTGRES_*` para outro banco.

## Estrutura

```
apps/api          API em NestJS
apps/web          interface em React e Vite
packages/contracts  tipos compartilhados entre a API e a web; o cliente gerado da
                  especificação OpenAPI chega com a camada HTTP
```

Cada módulo do domínio da API se divide em `domain`, `application`, `infrastructure` e
`http`, com as dependências apontando sempre para dentro. A regra está escrita em
[`docs/adr/0005-camadas-isoladas-por-regra-de-dependencia.md`](docs/adr/0005-camadas-isoladas-por-regra-de-dependencia.md)
e é verificada pelo `dependency-cruiser`.

## Bordas transversais

**Log.** Toda requisição sai em JSON com um identificador de correlação. Se a requisição
chegar com o cabeçalho `x-correlation-id`, ele é reaproveitado; senão a API gera um. O
identificador volta no cabeçalho da resposta e aparece em toda linha de log daquela
requisição. O campo `documento` é apagado do log por regra de redação, configurada antes
mesmo de o campo existir.

**Erro.** Toda falha sai no formato Problem Details da
[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457), aplicado por filtro global, com o
tipo de conteúdo `application/problem+json` e o identificador de correlação no corpo.
Erro não previsto vira 500 com detalhe genérico: o rastro fica no log, não na resposta.

## O catálogo de Cultura

A Cultura vive num catálogo editável, com carga inicial das espécies mais comuns. Além do
nome como a operadora digitou, cada Cultura carrega uma chave de comparação: o nome sem
acento, sem caixa e sem espaço sobrando. É sobre ela que a unicidade é declarada, e é ela
que impede "Café", "cafe" e "CAFÉ" de virarem três linhas do catálogo.

A Safra é identificada por um ano e é compartilhada por todas as Propriedades. Ela não
guarda referência a Propriedade nem a Produtor: quem liga os três é o Plantio.

## Portões de qualidade

Os mesmos comandos que a pipeline roda:

```bash
pnpm lint              # ESLint, com complexidade cognitiva limitada a 15 por função
pnpm openapi           # regera a especificação e o cliente do pacote de contratos
pnpm typecheck         # tsc --noEmit nos três pacotes
pnpm depcruise         # regra de dependência entre as camadas
pnpm test              # testes de unidade, para o laço de TDD
pnpm test:coverage     # os mesmos, com o portão de cobertura; é este que a pipeline roda
pnpm test:integration  # testes de integração
pnpm audit:gate        # falha em vulnerabilidade alta ou crítica
pnpm build             # build dos três pacotes
```

O portão de cobertura vale só em `domain` e em `application`, que são as camadas onde há
decisão de verdade. O limite e a razão dele estão no `apps/api/jest.config.ts`.

A pipeline também confere que a especificação versionada e o cliente gerado estão em dia
com os decoradores. Se alguém mudar uma rota e esquecer de rodar `pnpm openapi`, o trabalho
rápido acusa.

A pipeline roda em dois trabalhos paralelos: um rápido, com tudo acima menos a
integração, e um lento reservado aos testes de integração. O lento também sobe a
composição e confere que a rota de saúde responde. Os dois precisam passar para o pull
request ser incorporado.

Duas dependências transitivas estão presas por `pnpm.overrides` no `package.json`, porque
o pacote que as puxa ainda não adotou a correção de segurança: `multer`, vindo de
`@nestjs/platform-express`, e `minimatch`, vindo de `eslint-plugin-sonarjs`.
