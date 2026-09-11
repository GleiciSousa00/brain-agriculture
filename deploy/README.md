# Deploy

O cadastro roda numa VPS x86 barata, com Ubuntu LTS. Cada push na `main` põe no ar o que
foi publicado, sem ninguém entrar na máquina. O caminho manual continua valendo e está
descrito aqui, porque é dele que se precisa quando o automático falha. Tudo o que a
operação precisa saber está neste arquivo. Não há registro de decisão sobre
infraestrutura, de propósito: ela não é o que está sendo avaliado.

## O ambiente que está de pé

| O quê | Valor |
|---|---|
| Endereço | https://brain-ag-test.duckdns.org |
| Provedor | Vultr, x86, Ubuntu LTS |
| Raiz na VPS | `/opt/cadastro-rural` |
| Usuário do basic auth | `brain-user` |

A senha não está neste repositório, que é público. Ela vive no `.env` da VPS e é entregue
fora do git, na mensagem que leva o link. Para trocá-la, mude `BASIC_AUTH_PASSWORD` no
`.env` e rode `docker compose up -d web`: o hash é gerado no arranque do contêiner, então
não há o que recalcular à mão.

O acesso por IP, sem TLS, existiu por algumas horas em 2026-09-10, enquanto o certificado
não saía. Ele não existe mais: o `Caddyfile` tem um endereço só, o do domínio, e o IP em
HTTP só responde o redirecionamento que o Caddy faz para HTTPS, onde não há certificado
que sirva para ele. Um endereço `http://` escrito à mão aqui é um furo e não pode voltar.

## O que sobe

Três contêineres. O Postgres 17, que guarda os dados num volume e não publica porta. A API,
que também não publica porta e roda as migrações no arranque. E a interface web, servida
pelo Caddy, que é o único proxy do sistema: emite e renova o certificado TLS, pede usuário
e senha para o site inteiro, entrega os arquivos estáticos e repassa `/api` para a API,
cortando o prefixo. As imagens vêm prontas do GitHub Container Registry, publicadas pela
pipeline a cada commit na `main`, com a tag `latest` e a tag do SHA do commit.

## Antes de tudo, uma vez

1. **Alugar a VPS.** x86, Ubuntu LTS, 2 GB de RAM bastam. Uma Hetzner CX22 serve.
2. **Criar o subdomínio no [DuckDNS](https://www.duckdns.org)** apontando para o IP da
   VPS. É gratuito e o Caddy emite o certificado para ele sem configuração extra.
3. **Tornar os dois pacotes públicos no GitHub.** Eles só existem depois que a pipeline
   roda na `main` pela primeira vez com este deploy. Feito isso, na página *Packages* do
   repositório abra `cadastro-rural-api` e `cadastro-rural-web`, e em *Package settings*
   use *Change visibility*. Sem isso a VPS não consegue puxar as imagens sem credencial.

## Subir

1. Na VPS, como root, rode o script de preparação. Ele instala o Docker, abre só as portas
   22, 80 e 443 no firewall, clona o repositório em `/opt/cadastro-rural` e cria o `.env`
   a partir do exemplo:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/GleiciSousa00/brain-agriculture/main/deploy/bootstrap.sh | sudo bash
   ```

   Quem preferir não executar script direto da rede pode copiar
   [`bootstrap.sh`](bootstrap.sh) para a VPS e rodá-lo de lá. O script é idempotente:
   rodar de novo não estraga nada.

2. Preencha `/opt/cadastro-rural/deploy/.env`. Cada variável tem, no comentário, o comando
   que gera o valor. Todas as que estão vazias são obrigatórias.

3. Suba:

   ```bash
   cd /opt/cadastro-rural/deploy
   docker compose pull && docker compose up -d
   ```

4. Espere alguns segundos. A primeira emissão do certificado precisa que as portas 80 e
   443 estejam alcançáveis pela internet, e o domínio já apontando para o IP. Depois abra
   `https://<domínio>` e entre com o usuário e a senha do `.env`. A especificação da API
   fica em `https://<domínio>/api/docs`, atrás da mesma senha.

Se algo não subir, o primeiro lugar a olhar é o log da API:

```bash
docker compose logs -f api
```

O próprio `docker compose` recusa subir com o `.env` incompleto, e diz qual variável falta. A
API, por sua vez, recusa arrancar com as chaves públicas de desenvolvimento.

## Atualizar

Sozinho, a cada push na `main`. Depois de `fast`, `integration` e `publish` passarem, o
trabalho `deploy` abre uma sessão SSH na VPS e roda [`atualizar.sh`](atualizar.sh), que
traz a `main`, puxa as imagens e sobe. As migrações rodam no arranque da API, então não há
passo de banco.

À mão, quando for preciso, é o mesmo script:

```bash
/opt/cadastro-rural/deploy/atualizar.sh
```

O script traz a `main` com `merge --ff-only`. Se alguém tiver mexido à mão na árvore de
`/opt/cadastro-rural`, ele para com erro em vez de desfazer o que a pessoa fez. Nesse caso
a saída é entrar na máquina, decidir o que fica, e rodar de novo.

### Como a pipeline entra na VPS

Uma chave só para isso, que não abre um shell. A entrada dela no `authorized_keys` do
`root` tem comando forçado, então a sessão roda `atualizar.sh` e mais nada, seja qual for
o comando pedido do outro lado:

```
command="/opt/cadastro-rural/deploy/atualizar.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding ssh-ed25519 AAAA... ci-deploy-cadastro-rural
```

Do lado do GitHub são quatro segredos do repositório:

| Segredo | O que guarda |
|---|---|
| `DEPLOY_SSH_KEY` | a chave privada do par, sem frase secreta |
| `DEPLOY_HOST` | o IP da VPS |
| `DEPLOY_USER` | `root` |
| `DEPLOY_KNOWN_HOSTS` | a linha de `ssh-keyscan` do IP, para a pipeline não aceitar host desconhecido |

**Trocar a chave.** Gere um par novo com `ssh-keygen -t ed25519 -N '' -f ci_deploy`,
troque a linha no `authorized_keys` da VPS mantendo o `command=`, e ponha a privada em
`DEPLOY_SSH_KEY` com `gh secret set`. A chave velha deixa de valer assim que sai do
`authorized_keys`.

## Voltar versão

Aponte `IMAGE_TAG` no `.env` para o SHA do commit que se quer e suba de novo:

```bash
docker compose pull && docker compose up -d
```

O SHA está na lista de commits da `main` no GitHub, e também na página de versões de cada
pacote em *Packages*. A migração de banco não volta sozinha: voltar para uma versão
anterior a uma migração exige conferir se ela é compatível com o esquema atual.

## Segredos

O `.env` fica só no servidor e nunca entra no git. O `.gitignore` da raiz o ignora em
qualquer pasta, e o script de preparação o deixa legível só para root.

A chave de cifra e o segredo da impressão do Documento nunca mudam depois do primeiro
`up`. Trocar a chave torna ilegível todo Documento já gravado. Trocar o segredo quebra a
unicidade, porque o mesmo Documento passa a ter outra impressão. Ver
[`docs/adr/0002`](../docs/adr/0002-documento-cifrado-em-repouso.md).

## O que ficou de fora, de propósito

A razão é uma só: ficar online com o menor número de peças; a infra não é o que está sendo
avaliado.

- Observabilidade: sem coleta de logs, métricas ou alertas. O log fica no `json-file` do
  Docker, limitado a 30 MB por contêiner.
- Backup do Postgres. Os dados vivem num volume nomeado, e só.
- Ambiente de homologação. O deploy automático vai direto para produção, e quem segura o
  que não presta são os portões que rodam antes dele.
- Imagens para outras arquiteturas: só amd64.
- Autenticação de verdade. A senha do Caddy cobre o site, e a decisão de não ter login na
  aplicação está em [`docs/adr/0006`](../docs/adr/0006-autenticacao-fora-do-escopo.md).
- Alta disponibilidade e troca de versão sem interrupção. Cada `up -d` derruba e sobe o
  contêiner que mudou.
