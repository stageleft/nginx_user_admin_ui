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
    * datavol（ホームページ本体） ；ホストのホームページ群（HTMLファイル）をnginxに見せる用。 \
      （nginxコンテナには設定を入れたくなかった）
    * （余力があれば）DBアクセスUIアプリ
    * （余力があれば）DBアクセスAPIアプリ
* HTTPファイルのディレクトリ設計（相対パスをnginxのlocationとして表現する）
  * / ： 公開ディレクトリ（ルートディレクトリ）。HTMLファイルは認証なしで閲覧できる。
    * /webadmin/ ： 非公開ディレクトリ１（上記DBアクセスUI/API向け）。HTMLファイルに認証が必要とする。
    * /sysadmin/ ： 非公開ディレクトリ２（ローカルサーバのコンディションを確認するため、syslog見るとかCPU/Mem/Disk監視とかやる）。HTMLファイルに認証が必要とする。

Webサーバは nginx をコンテナで採用する。 Apache や Tomcat をホストで利用するのであれば設定が容易なので面白みがない。

* [nginx の Configuration](http://nginx.org/en/docs/http/configuring_https_servers.html) にある、
  [Module ngx_http_auth_basic_module](http://nginx.org/en/docs/http/ngx_http_auth_basic_module.html) の書き換えを考える。

### Docker のインストール

Docker のインストールは、公式サイト https://docs.docker.com/engine/install/ を参照して実施する。

### PostgreSQL コンテナの設定

* PostgreSQL サーバ は Dockerオフィシャルサイトイメージ https://hub.docker.com/_/postgres から取得してくる。

  ```bash
  docker pull postgres
  ```

* サーバを実行する。

  ```bash
  docker run -d --restart=always --name some-postgres -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword -d postgres
  ```

  上記、 `POSTGRES_PASSWORD=mysecretpassword` は適宜変更すること。本書ではこのままの設定として話を進める。

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
     file     | character varying(32)   |           |          | 
     type     | character varying(32)   |           |          | 
     location | character varying(2048) |           |          | 

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
    * location `/` の設定。 \
      auth_basic off;
      auth_basic_user_file ""; （あるいは設定なし）
    * location `/webadmin/` の設定。\
      auth_basic "web access admin"; \
      auth_basic_user_file "conf/webadmin_passwd";
    * location `/sysadmin/` の設定。 \
      auth_basic "system admin"; \
      auth_basic_user_file "conf/sysadmin_passwd";

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    INSERT INTO location (location, type, file) VALUES ('/', 'off', '');
    INSERT INTO location (location, type, file) VALUES ('/webadmin/', 'web admin', 'conf/webadmin_passwd');
    INSERT INTO location (location, type, file) VALUES ('/sysadmin/', 'system admin', 'conf/sysadmin_passwd');
    EOF
    ```

    データの存在確認は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    SELECT * FROM location;
    EOF
    Password for user postgres: 
      location  |     type     |         file         
    ------------+--------------+----------------------
     /          | off          | 
     /webadmin/ | web admin    | conf/webadmin_passwd
     /sysadmin/ | system admin | conf/sysadmin_passwd
    (3 rows)
    ```

    データの削除（登録失敗時のリカバリ）は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    DELETE FROM location;
    EOF
    ```

  * userfileユーザ一覧 \
    * ファイル `conf/webadmin_passwd` の設定。
      * ユーザ1 name=webadmin, password=webpass, comment=なし
      * ユーザ2 name=sysadmin, password=syspass, comment=same as /sysadmin/ dir.
    * ファイル `conf/sysadmin_passwd` の設定。
      * ユーザ1 name=sysadmin, password=syspass, comment=なし

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    INSERT INTO userfile (file, username, password) VALUES ('conf/webadmin_passwd', 'webadmin', 'webpass');
    INSERT INTO userfile (file, username, password, comment) VALUES ('conf/webadmin_passwd', 'sysadmin', 'syspass', 'same as /sysadmin/ dir.');
    INSERT INTO userfile (file, username, password) VALUES ('conf/sysadmin_passwd', 'sysadmin', 'syspass');
    EOF
    ```

    データの存在確認は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    SELECT * FROM userfile;
    EOF
    Password for user postgres: 
             file         | username | password |         comment         
    ----------------------+----------+----------+-------------------------
     conf/webadmin_passwd | webadmin | webpass  | 
     conf/webadmin_passwd | sysadmin | syspass  | same as /sysadmin/ dir.
     conf/sysadmin_passwd | sysadmin | syspass  | 
    (3 rows)
    ```

    データの削除（登録失敗時のリカバリ）は以下の通り。

    ```bash
    $ psql -d settings_nginx -U postgres -h 172.17.0.1 <<EOF
    DELETE FROM userfile;
    EOF
    ```

### datavol コンテナの設定

### Nginx コンテナの設定
