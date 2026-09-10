# Imagem da API. O contexto de build é a raiz do monorepo, não esta pasta.

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# --- Dependências -------------------------------------------------------------------
# Os manifestos entram antes do código: enquanto eles não mudam, a instalação é cache.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile

# --- Compilação ---------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN pnpm --filter @cadastro-rural/contracts build \
  && pnpm --filter @cadastro-rural/api build \
  && pnpm install --frozen-lockfile --prod

# --- Execução -----------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
# O caminho é o mesmo do estágio anterior porque os vínculos do pnpm são absolutos.
COPY --from=build --chown=node:node /repo /repo
USER node
WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
