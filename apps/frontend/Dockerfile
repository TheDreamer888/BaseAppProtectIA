# --- build stage ---
FROM node:24.9.0-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate \
	&& pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

# --- runtime stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1
