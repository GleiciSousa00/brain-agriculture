# Imagem da interface web. O contexto de build é a raiz do monorepo, não esta pasta.

FROM node:24-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @cadastro-rural/contracts build \
  && pnpm --filter @cadastro-rural/web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
