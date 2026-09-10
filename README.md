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

A rota de saúde responde sem tocar em nenhuma tabela do cadastro: ela manda um `SELECT 1`
no banco e mais nada.

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

## Portões de qualidade

Os mesmos comandos que a pipeline roda:

```bash
pnpm lint              # ESLint, com complexidade cognitiva limitada a 15 por função
pnpm typecheck         # tsc --noEmit nos três pacotes
pnpm depcruise         # regra de dependência entre as camadas
pnpm test              # testes de unidade
pnpm test:integration  # testes de integração
pnpm audit:gate        # falha em vulnerabilidade alta ou crítica
pnpm build             # build dos três pacotes
```

A pipeline roda em dois trabalhos paralelos: um rápido, com tudo acima menos a
integração, e um lento reservado aos testes de integração. O lento também sobe a
composição e confere que a rota de saúde responde. Os dois precisam passar para o pull
request ser incorporado.

Duas dependências transitivas estão presas por `pnpm.overrides` no `package.json`, porque
o pacote que as puxa ainda não adotou a correção de segurança: `multer`, vindo de
`@nestjs/platform-express`, e `minimatch`, vindo de `eslint-plugin-sonarjs`.
