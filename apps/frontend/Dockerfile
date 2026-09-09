# --- build stage ---
FROM node:24.19.0-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate \
	&& pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

# --- runtime stage ---
FROM nginx:stable-alpine
RUN apk add --no-cache curl wget
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD if command -v curl >/dev/null 2>&1; then curl -fsS http://localhost/ >/dev/null; elif command -v wget >/dev/null 2>&1; then wget -qO- http://localhost/ >/dev/null; else exit 1; fi
