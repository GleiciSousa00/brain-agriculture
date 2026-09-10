#!/usr/bin/env bash
# Prepara uma VPS Ubuntu LTS recém-criada para receber o cadastro: Docker, firewall e o
# clone do repositório em /opt/cadastro-rural. Rode como root ou com sudo.
#
# Cada passo confere antes de agir, então rodar duas vezes não estraga nada. O script para
# antes de subir os contêineres, porque o `.env` precisa ser preenchido à mão.
set -euo pipefail

REPOSITORIO='https://github.com/GleiciSousa00/brain-agriculture.git'
DESTINO='/opt/cadastro-rural'

log() {
  printf '\n==> %s\n' "$*"
}

if [[ "${EUID}" -ne 0 ]]; then
  echo 'Rode como root ou com sudo.' >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# Uma VPS recém-criada vem com o índice do apt vazio ou velho, e `install` sem `update`
# falha com 404. Uma vez aqui, para todos os passos; o do Docker repete depois de
# acrescentar a fonte dele.
apt-get update
apt-get install -y ca-certificates curl git ufw

# 1. Docker Engine e o plugin do Compose, pelo repositório apt oficial. O script de
#    conveniência do Docker é evitado de propósito: ele muda sem aviso e não é idempotente.
if docker compose version > /dev/null 2>&1; then
  log 'Docker com Compose já instalado, pulando.'
else
  log 'Instalando Docker Engine e o plugin do Compose.'
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck source=/dev/null
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-${VERSION_CODENAME}} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

# 2. Firewall: só SSH e as duas portas do Caddy. Ele protege o que roda na máquina, e não
#    os contêineres: porta publicada pelo Docker passa por fora do ufw. O que mantém o
#    Postgres e a API fechados é a composição não publicar porta para eles.
log 'Configurando o firewall.'
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 3. O repositório. A composição de produção lê o Caddyfile desta pasta, por isso o clone
#    inteiro fica no servidor, e não só o docker-compose.yml.
if [[ -d "${DESTINO}/.git" ]]; then
  log "Atualizando ${DESTINO}."
  git -C "${DESTINO}" pull --ff-only
else
  log "Clonando em ${DESTINO}."
  git clone "${REPOSITORIO}" "${DESTINO}"
fi

# 4. O `.env`, a partir do exemplo. Nunca sobrescreve: o que já está lá tem os segredos
#    que não podem mudar. Só root lê, porque ali estão as chaves do Documento.
if [[ -f "${DESTINO}/deploy/.env" ]]; then
  log 'deploy/.env já existe, mantendo.'
else
  log 'Criando deploy/.env a partir do exemplo.'
  cp "${DESTINO}/deploy/.env.example" "${DESTINO}/deploy/.env"
fi
chmod 600 "${DESTINO}/deploy/.env"

# 5. O que falta é manual.
log 'Pronto. Próximos passos:'
cat <<FIM

  1. Preencha ${DESTINO}/deploy/.env. Os comandos para gerar cada valor estão nos comentários.
  2. Suba:
       cd ${DESTINO}/deploy && docker compose pull && docker compose up -d

FIM
