#!/usr/bin/env bash
# Prepara uma VPS Ubuntu LTS: Docker, firewall e o clone em /opt/cadastro-rural. Idempotente.
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

apt-get update
apt-get install -y ca-certificates curl git ufw

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

# Porta publicada pelo Docker passa por fora do ufw.
log 'Configurando o firewall.'
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [[ -d "${DESTINO}/.git" ]]; then
  log "Atualizando ${DESTINO}."
  git -C "${DESTINO}" pull --ff-only
else
  log "Clonando em ${DESTINO}."
  git clone "${REPOSITORIO}" "${DESTINO}"
fi

if [[ -f "${DESTINO}/deploy/.env" ]]; then
  log 'deploy/.env já existe, mantendo.'
else
  log 'Criando deploy/.env a partir do exemplo.'
  cp "${DESTINO}/deploy/.env.example" "${DESTINO}/deploy/.env"
fi
chmod 600 "${DESTINO}/deploy/.env"

log 'Pronto. Próximos passos:'
cat <<FIM

  1. Preencha ${DESTINO}/deploy/.env. Os comandos para gerar cada valor estão nos comentários.
  2. Suba:
       cd ${DESTINO}/deploy && docker compose pull && docker compose up -d

FIM
