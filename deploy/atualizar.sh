#!/usr/bin/env bash
# Põe no ar o que está na `main`. É o comando forçado da chave que a pipeline usa, então
# ele não recebe argumento nenhum: o que a sessão SSH pedir é ignorado.
set -euo pipefail

DESTINO='/opt/cadastro-rural'

log() {
  printf '\n==> %s\n' "$*"
}

cd "${DESTINO}"

log 'Trazendo a main.'
/usr/bin/git fetch --prune origin main
# Avanço direto, e não merge: a árvore do servidor não tem commit próprio, e se tiver é
# porque alguém mexeu à mão, e aí o deploy tem de parar em vez de desfazer o que a pessoa fez.
/usr/bin/git merge --ff-only origin/main
/usr/bin/git --no-pager log --oneline -1

cd "${DESTINO}/deploy"

log 'Puxando as imagens publicadas.'
/usr/bin/docker compose pull --quiet

log 'Subindo.'
/usr/bin/docker compose up -d --remove-orphans

log 'Como ficou.'
/usr/bin/docker compose ps --format 'table {{.Service}}\t{{.Status}}'

# As imagens antigas se acumulam a cada deploy, e o disco da VPS é pequeno.
/usr/bin/docker image prune --force --filter 'until=168h' > /dev/null
