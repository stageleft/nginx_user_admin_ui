# stageleft.github.io

## Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理するアプリ

ローカルサーバにて、ローカルコンテンツを管理するWebサーバを立てたい。

このとき、ユーザによって表示するコンテンツを分けたいが、ローカルサーバなのでガチの認証はやりたくない。

上記のモチベーションのもと、コンテナ start 時に、
BASIC認証設定を含むサーバ設定を（ある程度決め打ちで）自動生成し、
設定ファイルを書き換え → Webエンジン起動、とすることで、ユーザ情報の自動設定を行うものである。

なお、ここまでの説明で分かる通り、本書で取り扱う認証・認可の仕組みはユーザビリティであり、セキュリティは考慮しない。 \
したがって、パブリッククラウド等インターネットからのアクセスが物理的に可能なネットワーク構成は想定しない。よりセキュアで便利な認証認可ソリューションを探して使ってください。

### 構成

* OS : Ubuntu Linux ※Linux依存はともかくディストリ依存は最小化するため、Dockerさえあればなんとかなるように構成する。
  * アプリ ： [Docker](https://www.docker.com/ja-jp/)をベースにする。コンテナは以下。
    * [PostgreSQL](https://www.postgresql.org/) [Dockerオフィシャルサイトのpostgresイメージ](https://hub.docker.com/_/postgres) を取得してくる。
    * [nginx](https://www.nginx.com/)
      * Basic認証のユーザ・パスワードファイルをPostgreSQL経由で生成するためのアプリ（自作）を含む。
    * html（ホームページ本体） ；ホームページ群（HTMLファイル）を抱えておき、data volume を経由して nginxに見せる用。 \
      （nginxコンテナには設定を入れたくなかった）
      * `/nginx_html/` ディレクトリ：ホームページ群。
      * `/nginx_setup/` ディレクトリ：下記変換コンテナアプリ → nginx コンテナアプリへ設定を渡す用。
    * （余力があれば）DBアクセスUIアプリ
    * （余力があれば）DBアクセスAPIアプリ
* HTTPファイルのディレクトリ設計（nginxコンテナの設定は別途Dockerfileで読み込むものとする）
  * / ： 公開ディレクトリ（ルートディレクトリ）。HTMLファイルは認証なしで閲覧できる。←この設定は固定。
  * /webadmin/ ： 非公開ディレクトリ１（上記DBアクセスUI/API向け）。HTMLファイルに認証が必要とする。
  * /sysadmin/ ： 非公開ディレクトリ２（ローカルサーバのコンディションを確認するため、syslog見るとかCPU/Mem/Disk監視とかやる）。HTMLファイルに認証が必要とする。

Webサーバは nginx をコンテナで採用する。 Apache や Tomcat をホストで利用するのであれば設定が容易なので面白みがない。
また、ソフト一般としては express (node.js) や sinatra (ruby) なども活用可だがこれも考えないものとする。

* [nginx の Configuration](http://nginx.org/en/docs/http/configuring_https_servers.html) にある、
  [Module ngx_http_auth_basic_module](http://nginx.org/en/docs/http/ngx_http_auth_basic_module.html) の書き換えを考える。

### Docker のインストールと設定

Docker （Docker Compose を含む）のインストールは、[Docker公式サイトのインストール手順書](https://docs.docker.com/engine/install/) を参照して実施する。

* Docker compose の実行

  ```bash
  docker compose up -d
  ```

* Docker compose の削除・切り戻し

  ```bash
  docker compose down
  ```

### Docker Composeの確認

* Docker ネットワーク の確認

  ```bash
  $ docker network ls
  NETWORK ID     NAME              DRIVER    SCOPE
  3de504add449   bridge            bridge    local
  40fdce76b671   host              host      local
  f1afd560a3ef   none              null      local
  05c6b1dfb632   work_default      bridge    local
  f5d2a995cf92   work_localwebnw   bridge    local
  ```

* Docker volume の確認

  ```bash
  $ docker volume ls
  DRIVER    VOLUME NAME
  local     work_datavol
  ```

* Docker コンテナイメージの確認

  ```bash
  $ docker ps
  CONTAINER ID   IMAGE             COMMAND                  CREATED         STATUS         PORTS                                       NAMES
  f3b19493084e   postgres:latest   "docker-entrypoint.s…"   4 minutes ago   Up 3 minutes   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   work-dbserver-1
  ※他にWebサーバコンテナがあるはず。
  ```

### PostgreSQL コンテナの設計

* Docker Compose でサーバを実行する。

* （必要があれば）サーバの動作確認を行う。
  * ホスト名（IPアドレス）の確認

    ```bash
    $ ip address show dev docker0 | grep inet
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
    inet6 fe80::42:71ff:fe76:3fd0/64 scope link 
    ```

  * デフォルトDB \
    `compose.yaml` 内に記した環境変数 `POSTGRES_DB` に設定したユーザ名。
  * ユーザ \
    `compose.yaml` 内に記した環境変数 `POSTGRES_USER` に設定したユーザ名。
  * パスワード \
    `compose.yaml` 内に記した環境変数 `POSTGRES_PASSWORD` に設定したパスワード。

  * ホストサーバへ PosgtreSQL クライアントのインストール（未検証） \
    Ubuntu の場合、 `sudo apt install postgresql-client` だと思われる。

  * PosgtreSQL サーバへのログイン \

    ```bash
    $ psql -d postgres -U postgres -h 172.17.0.1
    Password for user postgres: 
    psql (14.10 (Ubuntu 14.10-0ubuntu0.22.04.1), server 16.1 (Debian 16.1-1.pgdg120+1))
    WARNING: psql major version 14, server major version 16.
             Some psql features might not work.
    Type "help" for help.

    postgres=# \q
    ```

    入力パスワードは上記に従う。本書の場合、 `mysecretpassword` となる。

* 必要なテーブル等を設定していく。
  * settings_nginx データベース（設定テーブル収納先）

    ```bash
    $ psql -d postgres -U postgres -h 172.17.0.1 <<EOF
    CREATE DATABASE settings_nginx;
    EOF
    ```

    データベースの存在確認は以下の通り。以下、 \l コマンドにて settings_nginx テーブルが存在することを確認する。

    ```bash
    $ psql -d postgres -U postgres -h 172.17.0.1
    Password for user postgres: 
    psql (14.10 (Ubuntu 14.10-0ubuntu0.22.04.1), server 16.1 (Debian 16.1-1.pgdg120+1))
    WARNING: psql major version 14, server major version 16.
             Some psql features might not work.
    Type "help" for help.

    postgres=# \l
     postgres       | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
     settings_nginx | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
     template0      | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
                    |          |          |            |            | postgres=CTc/postgres
     template1      | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
                    |          |          |            |            | postgres=CTc/postgres

    postgres=# \q
    ```

  * userfile 一覧
    * （主キー）auth_basic_user_file （同上）
    * name ユーザー名。
    * password 生パスワードを保存する（！）。nginxの設定ファイル生成時に、本パラメータで `openssl passwd -apr1 <password>` する。（後でUI/APIを作成するときに楽なほうをとる。セキュリティ的には大問題だが、管理容易性を優先し、UI/APIを用いる人は全てを知っているべきとの思想）
    * comment

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    CREATE TABLE userfile(file varchar(32), username varchar(128), password varchar(256), comment text);
    EOF
    ```

    テーブルの存在確認は以下の通り。以下、 \d コマンドにて userfile テーブルが存在し、カラムが設定通りであることを確認する。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1
    Password for user postgres: 
    psql (14.10 (Ubuntu 14.10-0ubuntu0.22.04.1), server 16.1 (Debian 16.1-1.pgdg120+1))
    WARNING: psql major version 14, server major version 16.
            Some psql features might not work.
    Type "help" for help.

    settings_nginx=# \d
              List of relations
    Schema |   Name   | Type  |  Owner   
    --------+----------+-------+----------
    public | userfile | table | postgres
    (1 rows)
    settings_nginx=# \d userfile
                          Table "public.userfile"
      Column  |          Type          | Collation | Nullable | Default 
    ----------+------------------------+-----------+----------+---------
     file     | character varying(32)  |           |          | 
     username | character varying(128) |           |          | 
     password | character varying(256) |           |          | 
     comment  | text                   |           |          | 

    settings_nginx=# \q
    ```

  * userfileユーザ一覧 \
    * ファイル `webadmin_passwd` の設定。
      * ユーザ1 name=webadmin, password=webpass, comment=なし
      * ユーザ2 name=sysadmin, password=syspass, comment=same as /sysadmin/ dir.
    * ファイル `sysadmin_passwd` の設定。
      * ユーザ1 name=sysadmin, password=syspass, comment=なし

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    INSERT INTO userfile (file, username, password) VALUES ('webadmin_passwd', 'webadmin', 'webpass');
    INSERT INTO userfile (file, username, password, comment) VALUES ('webadmin_passwd', 'sysadmin', 'syspass', 'same as /sysadmin/ dir.');
    INSERT INTO userfile (file, username, password) VALUES ('sysadmin_passwd', 'sysadmin', 'syspass');
    EOF
    ```

    データの存在確認は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    SELECT * FROM userfile;
    EOF
    Password for user postgres: 
          file       | username | password |         comment         
    -----------------+----------+----------+-------------------------
     webadmin_passwd | webadmin | webpass  | 
     webadmin_passwd | sysadmin | syspass  | same as /sysadmin/ dir.
     sysadmin_passwd | sysadmin | syspass  | 
    (3 rows)
    ```

    データの削除（登録失敗時のリカバリ）は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    DELETE FROM userfile;
    EOF
    ```

### Nginx コンテナの設定

* Docker Compose でサーバを実行する。

* （必要があれば）サーバの動作確認を行う。

  ```bash
  $ curl http://localhost/
  <!DOCTYPE html>
  <html>
  <head>
  <title>Welcome to nginx!</title>
  <style>
  html { color-scheme: light dark; }
  body { width: 35em; margin: 0 auto;
  font-family: Tahoma, Verdana, Arial, sans-serif; }
  </style>
  </head>
  <body>
  <h1>Welcome to nginx!</h1>
  <p>If you see this page, the nginx web server is successfully installed and
  working. Further configuration is required.</p>

  <p>For online documentation and support please refer to
  <a href="http://nginx.org/">nginx.org</a>.<br/>
  Commercial support is available at
  <a href="http://nginx.com/">nginx.com</a>.</p>

  <p><em>Thank you for using nginx.</em></p>
  </body>
  </html>
  ```

#### Nginx コンテナの標準設定確認

* /docker-entrypoint.sh の中身
  中身の超抜粋は以下のとおりなので、 `/docker-entrypoint.d/` ディレクトリ以下に `.sh` ファイルを置けば、よしなにやってくれることがわかる。 `sort -V` が入っているので、シェルスクリプト名は `000_init.sh` のように、固定桁数の番号を頭につけるのが望ましそう。古き良きLinuxの伝統（と個人的に思っている init.d のルール）に沿って、数字の桁数は3桁がよいか。

  ```bash
  if [ "$1" = "nginx" ] || [ "$1" = "nginx-debug" ]; then
      if /usr/bin/find "/docker-entrypoint.d/" -mindepth 1 -maxdepth 1 -type f -print -quit 2>/dev/null | read v; then
          find "/docker-entrypoint.d/" -follow -type f -print | sort -V | while read -r f; do
              case "$f" in
                  *.sh)
                    entrypoint_log "$0: Launching $f";
                    "$f"
              esac
          done
      fi
  fi
  exec "$@"
  ```

  つまり、固定の追加処理は Dockerfile で中に放り込むことになる。

* nginx.conf の中身
  設定変更のためには `/etc/nginx/nginx.conf` をカスタマイズしろと公式ドキュメントに書いてある。
  しかし、以下のとおり、 nginx.conf のカスタマイズは基本的に筋違いであり `/etc/nginx/conf.d/*.conf` に登録していくのが適切に見える。

  ```bash
  $ docker exec -it some-nginx bash
  # cat /etc/nginx/nginx.conf | grep -v "^\s*#" | grep -v "^\s*$"
  user  nginx;
  worker_processes  auto;
  error_log  /var/log/nginx/error.log notice;
  pid        /var/run/nginx.pid;
  events {
      worker_connections  1024;
  }
  http {
      include       /etc/nginx/mime.types;
      default_type  application/octet-stream;
      log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"';
      access_log  /var/log/nginx/access.log  main;
      sendfile        on;
      keepalive_timeout  65;
      include /etc/nginx/conf.d/*.conf;
  }
  ```

* default.conf の中身
  上記 `include` にて `/etc/nginx/conf.d/*.conf` が指定されているので、その他設定ファイルはそこにある。

  ```bash
  $ docker exec -it some-nginx bash
  # ls -l /etc/nginx/conf.d/*.conf
  -rw-r--r-- 1 root root 1093 Dec 24 04:50 /etc/nginx/conf.d/default.conf
  # cat /etc/nginx/conf.d/default.conf | grep -v "^\s*#" | grep -v "^\s*$"
  server {
      listen       80;
      listen  [::]:80;
      server_name  localhost;
      location / {
          root   /usr/share/nginx/html;
          index  index.html index.htm;
      }
      error_page   500 502 503 504  /50x.html;
      location = /50x.html {
          root   /usr/share/nginx/html;
      }
  }
  # cd /usr/share/nginx/html
  /usr/share/nginx/html# ls -l
  total 8
  -rw-r--r-- 1 root root 497 Oct 24 13:46 50x.html
  -rw-r--r-- 1 root root 615 Oct 24 13:46 index.html
  /usr/share/nginx/html# cat index.html 
  <!DOCTYPE html>
  <html>
  <head>
  <title>Welcome to nginx!</title>
  <style>
  html { color-scheme: light dark; }
  body { width: 35em; margin: 0 auto;
  font-family: Tahoma, Verdana, Arial, sans-serif; }
  </style>
  </head>
  <body>
  <h1>Welcome to nginx!</h1>
  <p>If you see this page, the nginx web server is successfully installed and
  working. Further configuration is required.</p>

  <p>For online documentation and support please refer to
  <a href="http://nginx.org/">nginx.org</a>.<br/>
  Commercial support is available at
  <a href="http://nginx.com/">nginx.com</a>.</p>

  <p><em>Thank you for using nginx.</em></p>
  </body>
  </html>
  /usr/share/nginx/html# cat 50x.html 
  <!DOCTYPE html>
  <html>
  <head>
  <title>Error</title>
  <style>
  html { color-scheme: light dark; }
  body { width: 35em; margin: 0 auto;
  font-family: Tahoma, Verdana, Arial, sans-serif; }
  </style>
  </head>
  <body>
  <h1>An error occurred.</h1>
  <p>Sorry, the page you are looking for is currently unavailable.<br/>
  Please try again later.</p>
  <p>If you are the system administrator of this resource then you should check
  the error log for details.</p>
  <p><em>Faithfully yours, nginx.</em></p>
  </body>
  </html>
  ```

#### Nginx コンテナのカスタマイズ設定

* BASIC認証のユーザ・パスワードをPostgreSQLと連携するために必要なカスタマイズ機能は以下のとおり。
  * PostgreSQLコンテナと通信し、ユーザ一覧を取得する。
  * 上記取得したユーザ一覧を用いて、パスワードファイルを作成する。

* カスタマイズスクリプトの設計方針
  * `/docker-entrypoint.d/00_setup_from_postgres.sh` ファイルを Dockerfile にて投入する。このスクリプトは起動時に以下のことを実現する。
    * datavolコンテナ内に生成されている `/etc/nginx/conf.d/userfile.sec` を削除する。
    * datavolコンテナ内に生成されている `/etc/nginx/conf.d/userfile.sec` を生成する。 \
      詳細は postgres_to_nginx/Readme.mdを参照すること。
  * 上記パスワードファイルを読み込むための `/etc/nginx/conf.d/*.conf` は別途、 Dockerfile にて生成しておく。
