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

### クライアント証明書の管理（購入、自己生成ともに同一テーブルで扱う）

データベース `settings_nginx` は上記と共用する。

```bash
$ psql -d settings_nginx -U postgres -h 172.17.0.1
Password for user postgres: 
psql (14.10 (Ubuntu 14.10-0ubuntu0.22.04.1), server 16.1 (Debian 16.1-1.pgdg120+1))
WARNING: psql major version 14, server major version 16.
        Some psql features might not work.
Type "help" for help.

settings_nginx=# \d
                  List of relations
 Schema |         Name          |   Type   |  Owner   
--------+-----------------------+----------+----------
 public | certfiles             | table    | postgres
 public | certfiles_file_id_seq | sequence | postgres
 public | userfile              | table    | postgres
(3 rows)

settings_nginx=# \d certfiles
                                          Table "public.certfiles"
    Column     |          Type          | Collation | Nullable |                  Default                   
---------------+------------------------+-----------+----------+--------------------------------------------
 file_id       | integer                |           | not null | nextval('certfiles_file_id_seq'::regclass)
 key_id        | integer                |           |          | 
 root_id       | integer                |           |          | 
 file_name     | character varying(128) |           |          | 
 data_type     | character varying(32)  |           |          | 
 prikey_entity | bytea                  |           |          | 
 pubkey_entity | bytea                  |           |          | 
 cert_entity   | bytea                  |           |          | 
 comment       | text                   |           |          | 
Indexes:
    "certfiles_pkey" PRIMARY KEY, btree (file_id)
Foreign-key constraints:
    "certfiles_key_id_fkey" FOREIGN KEY (key_id) REFERENCES certfiles(file_id) ON UPDATE CASCADE ON DELETE CASCADE
    "certfiles_root_id_fkey" FOREIGN KEY (root_id) REFERENCES certfiles(file_id) ON UPDATE CASCADE ON DELETE CASCADE
Referenced by:
    TABLE "certfiles" CONSTRAINT "certfiles_key_id_fkey" FOREIGN KEY (key_id) REFERENCES certfiles(file_id) ON UPDATE CASCADE ON DELETE CASCADE
    TABLE "certfiles" CONSTRAINT "certfiles_root_id_fkey" FOREIGN KEY (root_id) REFERENCES certfiles(file_id) ON UPDATE CASCADE ON DELETE CASCADE

settings_nginx=# select * from certfiles;
 file_id | key_id | root_id | file_name | data_type | prikey_entity | pubkey_entity | cert_entity | comment 
---------+--------+---------+-----------+-----------+---------------+---------------+-------------+---------
(0 rows)

settings_nginx=# \q
```

上記、テーブル設計 `\d certfiles` について以下の通り。

* certfiles 一覧
  * `file_id` （主キー）
  * `key_id` （上記 `file_id` への外部キー制約）署名した鍵の `file_id`。\
    依存関係の設計は以下のとおりだが、下記はデータベースとしては保証しない。
    * デジタル鍵ペア（date_type が `keypair`）の場合はNULLとする。
    * 公開鍵証明書（date_type が `cacert`,`root_selfca`,`selfcert` のいずれか）の場合、生成に用いた公開鍵の `file_id`。\
      注意として、秘密鍵の `file_id` ではない（後述の `root_id` 要素で管理するため）。
  * `root_id` （上記 `file_id` への外部キー制約）署名した証明書の file_id。\
    * デジタル鍵ペア（date_type が `keypair`）の場合、NULLとする。
    * CA署名証明書（date_type が `cacert`）、または、自作の X.509ルート証明書（`root_selfca` 自己署名証明書のみ）場合、NULLとする。
      * CA署名証明書の場合は、 `comment` 欄に証明書購入元ベンダー（窓口）を記載しておくとよい。
      * 自作の X.509ルート証明の場合は、 `comment` 欄にその旨を記載しておくとよい。
    * 自己署名証明書（date_type が `selfcert` のいずれか）の場合、生成に用いた公開鍵証明書の `file_id`。
  * `file_name` 鍵または公開鍵証明書のファイル名、FQDNであることが望ましい。拡張子はなく、アプリが以下のとおり自動で付与する。
    * 秘密鍵 `.key`
    * 公開鍵 `.csr` ※証明書署名要求の、 Common Name (CN) に `file_name` を設定したい。
    * 公開鍵証明書 `.crt`
  * `data_type` デジタル鍵ペアまたは公開鍵証明書のタイプ。値は下記４種類のいずれかを必ず設定すること。
    * `keypair` デジタル鍵ペア
      * 秘密鍵 private key。\
        `openssl genrsa 2048 > prikey.key` または `openssl ecparam -out prikey.key -name prime256v1 -genkey` のコマンドで作成する。後者のほうが暗号化が強いとのこと。
      * 公開鍵 public key。証明書署名要求 certificate signing request ともいう。\
        上記 `prikey.key` を用いて、 `openssl req -new -sha256 -key prikey.key -out pubkey.csr` のコマンドで作成する。
    * `cacert`CA署名証明書。\
      上記 `pubkey.csr` をCA認証局（の運営会社）に送付して購入する。
    * `root_selfca` 自作の X.509ルートCA証明書 root CA certificate。\
      上記 `prikey.key` および `pubkey.csr` を用いて、\
      `openssl x509 -req -sha256 -days 365 -in pubkey.csr -signkey prikey.key -out root_selfca.crt` のコマンドで作成する。 -days オプションに指定する日数は要再設計。
    * `selfcert` 自己署名証明書。\
      上記、ルート証明書（`root_selfca.crt` および、この公開鍵証明書を作成した `prikey.key(root_prikey.key という)`）と、別のデジタル鍵ペアの公開鍵 `pubkey.csr` を用いて、\
      `openssl x509 -req -in pubkey.csr -CA root_selfca.crt -CAkey root_prikey.key -CAcreateserial -out selfcert.crt -days 365 -sha256` のコマンドで作成する。 -days オプションに指定する日数は伸ばしたくない。
  * `prikey_entity` 秘密鍵ファイルの実体。デジタル鍵ペアでない場合は NULL となる。
  * `pubkey_entity` 公開鍵ファイルの実体。デジタル鍵ペアでない場合は NULL となる。
  * `cert_entity` 公開鍵証明書の実体。デジタル鍵ペアの場合は NULL となる。
  * `comment` コメント。ユーザーによるコメントか、システムによるコメント（上記 `root_id` を参照）かはアプリ次第とする。

上記 input_file の依存関係に関して、証明書の作成手順は、 https://learn.microsoft.com/ja-jp/azure/application-gateway/self-signed-certificates による。

### クライアント証明書のデプロイ状況

本テーブルは、上記 `certfiles` とJOINすることで、クライアント証明書（署名CA証明書、または、自己署名証明書）の適用状況を管理することを目的とする。

```bash
$ docker exec -it dbserver psql -U postgres -d settings_nginx
psql (16.1 (Debian 16.1-1.pgdg120+1))
Type "help" for help.

settings_nginx=# \d
                    List of relations
 Schema |           Name           |   Type   |  Owner   
--------+--------------------------+----------+----------
 public | certfiles                | table    | postgres
 public | certfiles_deploy_history | table    | postgres
 public | certfiles_file_id_seq    | sequence | postgres
 public | userfile                 | table    | postgres
(4 rows)

settings_nginx=# \d certfiles_deploy_history
                  Table "public.certfiles_deploy_history"
   Column    |            Type             | Collation | Nullable | Default 
-------------+-----------------------------+-----------+----------+---------
 file_id     | integer                     |           | not null | 
 deploy_date | timestamp(0) with time zone |           |          | 
Indexes:
    "certfiles_deploy_history_pkey" PRIMARY KEY, btree (file_id)
Foreign-key constraints:
    "certfiles_deploy_history_file_id_fkey" FOREIGN KEY (file_id) REFERENCES certfiles(file_id) ON UPDATE CASCADE ON DELETE CASCADE

settings_nginx=# select * from certfiles_deploy_history;
 file_id | deploy_date 
---------+-------------
(0 rows)

settings_nginx=# \q
```

* certfiles_deploy_history 一覧
  * `file_id` （主キーかつ外部キー）デプロイ対象となる証明書の `file_id`
  * `deploy_date` 証明書のデプロイを指示した時刻。未指示の場合はNULLとなる。

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
