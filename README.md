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
    * [PostgreSQL](https://www.postgresql.org/)
    * [nginx](https://www.nginx.com/)
    * datavol（ホームページ本体） ；ホームページ群（HTMLファイル）を抱えておき、nginxに見せる用。 \
      （nginxコンテナには設定を入れたくなかった）
      * `/nginx_html/` ディレクトリ：ホームページ群。
      * `/nginx_setup/` ディレクトリ：下記変換コンテナアプリ → nginx コンテナアプリへ設定を渡す用。
    * データ収集→変換コンテナアプリ（自作）
    * （余力があれば）DBアクセスUIアプリ
    * （余力があれば）DBアクセスAPIアプリ
* HTTPファイルのディレクトリ設計（相対パスをnginxのlocationとして表現する）
  * / ： 公開ディレクトリ（ルートディレクトリ）。HTMLファイルは認証なしで閲覧できる。←この設定は固定。
    * /webadmin/ ： 非公開ディレクトリ１（上記DBアクセスUI/API向け）。HTMLファイルに認証が必要とする。
    * /sysadmin/ ： 非公開ディレクトリ２（ローカルサーバのコンディションを確認するため、syslog見るとかCPU/Mem/Disk監視とかやる）。HTMLファイルに認証が必要とする。
    * その他、 `<１個下のディレクトリ>` のみ、認証対応する。

Webサーバは nginx をコンテナで採用する。 Apache や Tomcat をホストで利用するのであれば設定が容易なので面白みがない。

* [nginx の Configuration](http://nginx.org/en/docs/http/configuring_https_servers.html) にある、
  [Module ngx_http_auth_basic_module](http://nginx.org/en/docs/http/ngx_http_auth_basic_module.html) の書き換えを考える。

### Docker のインストールと設定

Docker のインストールは、[Docker公式サイトのインストール手順書](https://docs.docker.com/engine/install/) を参照して実施する。

* Docker ネットワークを作成する。

  ```bash
  docker network create localwebnw
  ```

* Docker ネットワークを確認する。

  ```bash
  $ docker network ls
  NETWORK ID     NAME         DRIVER    SCOPE
  3de504add449   bridge       bridge    local
  40fdce76b671   host         host      local
  ca46dba8774b   localwebnw   bridge    local
  f1afd560a3ef   none         null      local
  ```

### datavol コンテナの設定

* datavol コンテナは [DockerオフィシャルサイトのDebianイメージ](https://hub.docker.com/_/debian) から作成する。

  ```bash
  echo "FROM debian" > Dockerfile
  echo "RUN mkdir /datavol" >> Dockerfile
  echo "VOLUME datavol" >> Dockerfile 
  echo 'CMD ["/bin/true"]' >> Dockerfile
  docker build -t datavol .
  docker run --name datavol datavol
  ```

* datavol コンテナの作成完了は、以下の通り確認する。

  ```bash
  $ docker ps -a
  CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS                      PORTS                                       NAMES
  1925c68352eb   datavol              "/bin/true"              59 seconds ago   Exited (0) 47 seconds ago                                               datavol
  ```

* datavol コンテナの作成に失敗した場合、以下の通りコンテナの削除（切り戻し）が可能

  ```bash
  $ docker rm datavol
  datavol
  ```

### PostgreSQL コンテナの設定

* PostgreSQL サーバ は [Dockerオフィシャルサイトのpostgresイメージ](https://hub.docker.com/_/postgres) を取得してくる。

  ```bash
  docker pull postgres
  ```

* サーバを実行する。

  ```bash
  docker run -d --restart=always --network localwebnw --volumes-from datavol --name dbserver -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword -d postgres
  ```

  上記、 `POSTGRES_PASSWORD=mysecretpassword` は適宜変更すること。本書ではこのままの設定として話を進める。

  起動確認は以下のとおり。

  ```bash
  $ docker ps -a
  CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS          PORTS                                       NAMES
  CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS                     PORTS                                       NAMES
  2d7a489c7ded   postgres             "docker-entrypoint.s…"   24 seconds ago   Up 14 seconds              0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   dbserver
  1925c68352eb   datavol              "/bin/true"              4 minutes ago    Exited (0) 4 minutes ago                                               datavol
  ```

* PostgreSQL コンテナの作成に失敗した場合、以下の通りコンテナの削除（切り戻し）が可能

  ```bash
  $ docker stop dbserver && docker rm $_
  dbserver
  dbserver
  ```

* （必要があれば）サーバの動作確認を行う。
  * ホスト名（IPアドレス）の確認

    ```bash
    $ ip address show dev docker0 | grep inet
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
    inet6 fe80::42:71ff:fe76:3fd0/64 scope link 
    ```

  * デフォルトDB \
    runオプション `POSTGRES_DB` に設定したユーザ名。 \
    今回、特に指定していないので `postgres` になっている。
  * ユーザ \
    runオプション `POSTGRES_USER` に設定したユーザ名。 \
    今回、特に指定していないので `postgres` になっている。
  * パスワード \
    runオプション `POSTGRES_PASSWORD` に設定したパスワード。

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

  * locationリスト \
    http.server は唯一との強い仮定を置き、その中のlocation一覧を作成する。
    * （主キー） location（設定先URL）
      * location `/` は設定不可。
      * location `/hogehoge/` のみ設定可。location値には `hogehoge` 部分のみを設定する。
    * auth_basic （ngx_http_auth_basic_module のauth_basic設定。文字列offは設定offとして扱うため不可）
    * auth_basic_user_file （ngx_http_auth_basic_module のauth_basic_user_file設定）

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    CREATE TABLE location(location varchar(2048), type varchar(32), file varchar(32));
    EOF
    ```

    テーブルの存在確認は以下の通り。以下、 \d コマンドにて location テーブルが存在し、カラムが設定通りであることを確認する。

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
    public | location | table | postgres
    (1 rows)

    settings_nginx=# \d location
                          Table "public.location"
      Column  |          Type           | Collation | Nullable | Default 
    ----------+-------------------------+-----------+----------+---------
     location | character varying(2048) |           |          | 
     type     | character varying(32)   |           |          | 
     file     | character varying(32)   |           |          | 

    settings_nginx=# \q
    ```

  * userfile 一覧
    * （主キーかつ外部キー）auth_basic_user_file （同上）
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
    public | location | table | postgres
    public | userfile | table | postgres
    (2 rows)
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

  * locationリスト \
    * location `/` および `/default/` は設定しないこと。 `location.conf` のファイルを生成する。
    * auth_basic_user_file に指定したfilenameパラメータに従い、 `filename.sec` のファイルを生成する。
    * location `/webadmin/` の設定。\
      auth_basic "web access admin"; \
      auth_basic_user_file "webadmin_passwd";
    * location `/sysadmin/` の設定。 \
      auth_basic "system admin"; \
      auth_basic_user_file "sysadmin_passwd";

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    INSERT INTO location (location, type, file) VALUES ('webadmin', 'web admin', 'webadmin_passwd');
    INSERT INTO location (location, type, file) VALUES ('sysadmin', 'system admin', 'sysadmin_passwd');
    EOF
    ```

    データの存在確認は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    SELECT * FROM location;
    EOF
    Password for user postgres: 
     location |     type     |      file       
    ----------+--------------+-----------------
     webadmin | web admin    | webadmin_passwd
     sysadmin | system admin | sysadmin_passwd
    (2 rows)
    ```

    データの削除（登録失敗時のリカバリ）は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    DELETE FROM location;
    EOF
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

* Nginx サーバ は [Dockerオフィシャルサイトのnginxイメージ](https://hub.docker.com/_/nginx) を取得してくる。 \
  後で、 設定を postgreSQL から持ってきて出力するスクリプトを仕込むので、 Dockerfile を作成しておく。

  ```bash
  echo "FROM nginx" > Dockerfile
  docker build -t some-content-nginx .
  docker run --volumes-from datavol --name webserver -d -p 80:80 some-content-nginx
  ```

  コンテナ起動確認は以下のとおり。

  ```bash
  $ docker ps
  CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS          PORTS                                       NAMES
  bdf53be7b507   some-content-nginx   "/docker-entrypoint.…"   33 seconds ago   Up 10 seconds   0.0.0.0:80->80/tcp, :::80->80/tcp           some-nginx
  87f9ed774677   postgres             "docker-entrypoint.s…"   18 hours ago     Up 18 hours     0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   some-postgres
  ```

  コンテナの動作確認は以下の通り。

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

* nginx コンテナの作成に失敗した場合、あるいは作り直す場合、以下の通りコンテナの削除（切り戻し）が可能

  ```bash
  $ docker stop webserver && docker rm $_
  webserver
  webserver
  ```

* 設定ファイルの調査・確認

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

  * カスタマイズスクリプトの設計方針
    * `/docker-entrypoint.d/000_setup_from_postgres.sh` ファイルを Dockerfile にて投入する。このスクリプトは以下のことを実現する。
      * `/etc/nginx/conf.d/default.conf` があればそのままとし、他のファイルは削除する。
      * datavolコンテナ内に生成されている `location.conf` を、起動時に `/etc/nginx/conf.d/` に配置する。
      * datavolコンテナ内に生成されている `userfile.sec` を、起動時に `/etc/nginx/conf.d/` に配置する。
    * `000_setup_from_postgres.sh` 実装案

      ```bash
      # cat /docker-entrypoint.d/000_setup_from_postgres.sh
      #!/usr/bin/bash

      # remove previous settings
      find '/etc/nginx/conf.d/' -type f | grep -v 'default.conf' | while read -r f; do
        rm "$f" 
      done

      # add new setting
      cp /datavol/nginx_settings/*.conf /etc/nginx/conf.d/
      cp /datavol/nginx_settings/*.sec /etc/nginx/conf.d/
      ```

### postgresql_to_nginx コンテナ（自作）

postgreSQL に入っている location や user のデータを用いて、nginx 向けの BASIC認証設定ファイルを出力するプログラムを準備する。

詳細は postgres_to_nginx/Readme.mdを参照すること。
