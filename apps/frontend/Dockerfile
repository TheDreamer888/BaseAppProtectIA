# --- build stage ---
FROM fedora:41 AS build
RUN dnf install -y --setopt=install_weak_deps=False nodejs npm && dnf clean all
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate \
	&& pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

# --- runtime stage ---
FROM fedora:41
RUN dnf install -y --setopt=install_weak_deps=False nginx wget \
	&& dnf clean all
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
