FROM nginx:latest

# setup applications.
RUN apt update && apt install -y nodejs npm

# copy init scripts.
WORKDIR /
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

# copy apps
COPY set_basic_auth_user/ /set_basic_auth_user/
WORKDIR /set_basic_auth_user/
RUN npm install

COPY set_https_cert/ /set_https_cert/
WORKDIR /set_https_cert/
RUN npm install

# Copy nginx.conf to directory
WORKDIR /
RUN rm /etc/nginx/conf.d/default.conf
COPY sample.conf /etc/nginx/conf.d/

# Copy index.html to directory
COPY index.html /usr/share/nginx/html/

# expose HTTP port.
# Exposeするポートは /etc/nginx/conf.d/*.conf と歩調を合わせること。
EXPOSE 80
EXPOSE 443

# CMD コマンドはオフィシャルイメージから提供される。記載しないこと。

# debug用追加設定
# RUN apt update && apt install -y vim
