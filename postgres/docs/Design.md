# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ DBserverコンテナ設計

本コンテナを設計するにあたり、ベースイメージとして [Docker公式のPostgreSQLイメージ](https://hub.docker.com/_/postgres) を用いる。

## Docker設定（compose.yaml）

* ビルド、コンテナ名についてはディレクトリ構成を参照。
* コンテナ外との通信について、考え方は全体設計を参照。
  * `webserver` および `webadmin` に対しては、Docker内ネットワーク `localwebnw` を設定する。
  * コンテナ消失に対する備えとして、ボリューム `postgresdb` を用いてホストへデータベースをバックアップする。
* 環境変数については以下の通り。
  * `POSTGRES_DB` および `POSTGERS_USER` は、必要に応じて適宜変更する。カスタマイズ機能を追加する際の都合がなければそのままで良い。
  * `POSTGRES_PASSWORD` はセキュリティのため、各自の環境に応じて必ず変更すること。
* コンテナ終了時、即座に再起動する設定を入れておく。

上記を実現した設定が以下の通りとなる。

```yaml
  dbserver:
    build: ./postgres/.
    container_name: 'dbserver'
    networks:
      - localwebnw
    volumes:
      - type: volume
        source: postgresdb
        target: /var/lib/postgresql/data
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=【適宜変更】
    restart: always
```

## 実現するデータベース構成

以下の形にてデータベースを実現する。

### BASIC認証

postgres サーバのIPアドレスは 172.17.0.1 として記載する。

```bash
$ psql -d settings_nginx -U postgres -h 172.17.0.1
Password for user postgres: 
psql (14.10 (Ubuntu 14.10-0ubuntu0.22.04.1), server 16.1 (Debian 16.1-1.pgdg120+1))
WARNING: psql major version 14, server major version 16.
        Some psql features might not work.
Type "help" for help.

settings_nginx=# \l
                                  List of databases
      Name      |  Owner   | Encoding |  Collate   |   Ctype    |   Access privileges   
----------------+----------+----------+------------+------------+-----------------------
 settings_nginx | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
※無関係なDBは略
(4 rows)

settings_nginx=# \d
          List of relations
 Schema |   Name   | Type  |  Owner   
--------+----------+-------+----------
 public | userfile | table | postgres
(1 row)

settings_nginx=# \d userfile
                      Table "public.userfile"
  Column  |          Type          | Collation | Nullable | Default 
----------+------------------------+-----------+----------+---------
 file     | character varying(32)  |           |          | 
 username | character varying(128) |           |          | 
 password | character varying(256) |           |          | 
 comment  | text                   |           |          | 

settings_nginx=# select * from userfile;
      file       | username | password |         comment         
-----------------+----------+----------+-------------------------
 sysadmin_passwd | sysadmin | syspass  | 
 webadmin_passwd | sysadmin | syspass  | same as /sysadmin/ dir.
 webadmin_passwd | webadmin | webpass  | 
(3 rows)

settings_nginx=# \q
```

上記、テーブル設計 `\d userfile` について以下の通り。

* userfile 一覧
  * auth_basic_user_file のファイル名。使われ方はトップの Readme.md を参照。
  * name ユーザー名。
  * password 生パスワードを保存する（！）。\
    その後、nginxの設定ファイル生成時に、本パラメータで `openssl passwd -6 <password>` することを想定する。
  * comment

## コンテナ機能のカスタマイズ

* Dockerfile : postgres コンテナへ、以下のファイルを適用する。
* init/init-user-db.sh : postgres データベースへの初期設定を行う。データベースが存在する場合は、PostgreSQLコンテナの標準機能側で適宜スキップしてくれる。

## 開発資料

### コンテナの操作・設定方法

ホストと dbserver で直接通信する場合、以下の設定をしておく。

* ホスト名（IPアドレス）の確認

  ```bash
  $ ip address show dev docker0 | grep inet
  inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
  inet6 fe80::42:71ff:fe76:3fd0/64 scope link 
  ```

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

  入力パスワードは `compose.yaml` の記載に従う。
