# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ Webserverコンテナ設計

本コンテナを設計するにあたり、ベースイメージとして [Docker公式のNGINXイメージ](https://hub.docker.com/_/nginx) を用いる。

## Docker設定（compose.yaml）

* ビルド、コンテナ名についてはディレクトリ構成を参照。
* コンテナ外との通信について、考え方は全体設計を参照。
  * `dbserver` および `webadmin` に対しては、Docker内ネットワーク `localwebnw` を設定する。
  * `sysadmin` に対しては、Docker共有ボリューム `sysadminhtml` を設定する。ボリュームのマウント先については、 `sample.conf` に一致化させる。
  * 外部との通信については、HTTPを用いて行う。このため 80 ポートを公開する。
* 環境変数については以下の通り。
  * `POSTGRES_` 系の環境変数については、通信先SQLサーバである `dbserver` コンテナの設定に従う。
* コンテナ終了時、即座に再起動する設定を入れておく。

上記を実現した設定が以下の通りとなる。

```yaml
  webserver:
    build: ./nginx/.
    container_name: 'webserver'
    networks:
      - localwebnw
    ports:
      - "80:80"
    volumes:
      - type: volume
        source: sysadminhtml
        target: /usr/share/nginx/html/sysadmin
    environment:
      - POSTGRES_SERVER=【dbserverの設定による】
      - POSTGRES_PORT=【dbserverの設定による】
      - POSTGRES_DB=【dbserverの設定による】
      - POSTGRES_USER=【dbserverの設定による】
      - POSTGRES_PASSWORD=【dbserverの設定による】
    restart: always
```

## Nginx コンテナのカスタマイズにより導入すべき機能

* BASIC認証のユーザ・パスワードをPostgreSQLと連携して生成する。
  * PostgreSQLコンテナと通信し、ユーザ一覧を取得する。
  * 上記取得したユーザ一覧を用いて、パスワードファイルを作成する。

## コンテナ機能のカスタマイズ

* Dockerfile : nginx コンテナへ各種ファイルを適用する。
* sample.conf : nginx への設定。 `/etc/nginx/conf.d/default.conf` への差し替えとして機能する。
* default.conf.org : 上記 default.conf そのもの。参照用。 ※nginx公式から提供された設定ファイルなので、WTFPLライセンス対象外につき注意。
* index.html : nginx への設定。 `/usr/share/nginx/html/index.html` への差し替えとして機能する。
* index.html.org : 上記 index.html そのもの。参照用。 ※nginx公式から提供された設定ファイルなので、WTFPLライセンス対象外につき注意。
* 00_setup_from_postgres.sh : 下記アプリを実行するためのシェルスクリプト。実行結果として出力されたBASIC認証ファイルの確認およびアプリ再実行の機能も合わせ持つ。
  * 以前 `postgres_to_nginx/index.js` を実行した際に生成した認証ファイル `/etc/nginx/conf.d/*.sec` を削除する。
  * `postgres_to_nginx/index.js` を実行し、 `dbserver` に用意されたBASIC認証向けのユーザデータをもとに、BASIC認証ファイルを生成する。\
    * ファイルの形式は、 [nginx の Configuration](http://nginx.org/en/docs/http/configuring_https_servers.html) の
    [Module ngx_http_auth_basic_module](http://nginx.org/en/docs/http/ngx_http_auth_basic_module.html) を参照。
    * ファイル名のルールについてはシステム全体のReadme.mdを参照。
    * BASIC認証パスワードについて、 `dbserver` には生パスワードが入っている前提にて、 `openssl passwd -6 【生パスワード】` を実行した結果をパスワードとしてファイルに出力する。
* postgres_to_nginx ディレクトリ：上記アプリのファイル一式。

カスタマイズ機能を追加するたび、以下のファイルを追加していくこと。

* 追加： `xx_execute_function.sh` （追加機能のエントリーポイント）
* 追加： `function` ディレクトリ （追加機能本体）
* 編集： Dockerfile。 `00_setup_from_postgres.sh` および `postgres_to_nginx` を参考に、上記ファイルをコンテナに適用する。

## ホームページのカスタマイズ

ホームページのフォルダ構成をカスタマイズするにあたっては、上記 `sample.conf` のみ編集することを想定する。

## 調査資料： Nginx コンテナの標準設定確認

* 設定なしの状態における、ホームページアクセス結果

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

* 起動処理 `/docker-entrypoint.sh` の中身
  中身の超抜粋は以下のとおりなので、 `/docker-entrypoint.d/` ディレクトリ以下に `.sh` ファイルを置けば、よしなにやってくれることがわかる。 `sort -V` が入っているので、シェルスクリプト名は `00_init.sh` のように、固定桁数の番号を頭につけるのが望ましそう。他にも入っているファイルがあり、数字の桁数は2桁がよいか。

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

* 基本的な設定ファイル `/etc/nginx/nginx.conf` の中身
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
  ```

  上記、 `/usr/share/nginx/html` の中身は以下の通り。

  ```bash
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

## 調査資料： `dbserver` からの戻り値

`node-postgres` で実行した `SELECT * FROM userfile;` の結果例は以下。

```json
Result {
  command: 'SELECT',
  rowCount: 3,
  oid: null,
  rows: [
    {
      file: 'webadmin_passwd',
      username: 'webadmin',
      password: 'webpass',
      comment: null
    },
    {
      file: 'webadmin_passwd',
      username: 'sysadmin',
      password: 'syspass',
      comment: 'same as /sysadmin/ dir.'
    },
    {
      file: 'sysadmin_passwd',
      username: 'sysadmin',
      password: 'syspass',
      comment: null
    }
  ],
  fields: [
    Field {
      name: 'file',
      tableID: 16394,
      columnID: 1,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 36,
      format: 'text'
    },
    Field {
      name: 'username',
      tableID: 16394,
      columnID: 2,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 132,
      format: 'text'
    },
    Field {
      name: 'password',
      tableID: 16394,
      columnID: 3,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 260,
      format: 'text'
    },
    Field {
      name: 'comment',
      tableID: 16394,
      columnID: 4,
      dataTypeID: 25,
      dataTypeSize: -1,
      dataTypeModifier: -1,
      format: 'text'
    }
  ],
  _parsers: [
    [Function: noParse],
    [Function: noParse],
    [Function: noParse],
    [Function: noParse]
  ],
  _types: TypeOverrides {
    _types: {
      getTypeParser: [Function: getTypeParser],
      setTypeParser: [Function: setTypeParser],
      arrayParser: [Object],
      builtins: [Object]
    },
    text: {},
    binary: {}
  },
  RowCtor: null,
  rowAsArray: false,
  _prebuiltEmptyResultObject: { file: null, username: null, password: null, comment: null }
}
```
