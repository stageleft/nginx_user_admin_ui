FROM nginx

# setup applications.
RUN apt update && apt install -y nodejs npm

COPY postgres_to_nginx /node_apps
WORKDIR /node_apps
RUN npm install

WORKDIR /
COPY 00_setup_from_postgres.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/00_setup_from_postgres.sh

# Copy nginx.conf to directory
COPY admin_area.conf /etc/nginx/conf.d/

# expose HTTP port.
# Exposeするポートは /etc/nginx/conf.d/*.conf と歩調を合わせること。
EXPOSE 80

# CMD コマンドはオフィシャルイメージから提供される。記載しないこと。