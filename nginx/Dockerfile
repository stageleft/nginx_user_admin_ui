FROM nginx:latest

# setup applications.
RUN apt update && apt install -y nodejs npm

COPY postgres_to_nginx /node_apps
WORKDIR /node_apps
RUN npm install

WORKDIR /
COPY 00_setup_from_postgres.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/00_setup_from_postgres.sh

# Copy nginx.conf to directory
RUN rm /etc/nginx/conf.d/default.conf
COPY sample.conf /etc/nginx/conf.d/

# Copy index.html to directory
COPY index.html /usr/share/nginx/html/

# expose HTTP port.
# Exposeするポートは /etc/nginx/conf.d/*.conf と歩調を合わせること。
EXPOSE 80

# CMD コマンドはオフィシャルイメージから提供される。記載しないこと。

# debug用追加設定
# RUN apt update && apt install -y vim
