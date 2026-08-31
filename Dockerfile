# ── Etap 1: budowa statycznych plików ────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Najpierw same manifesty — dzięki temu warstwa z npm ci trafia do cache
# i nie przelicza się przy każdej zmianie kodu.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etap 2: serwowanie ───────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
