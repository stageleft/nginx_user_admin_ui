# Basic認証のユーザ・パスワード設定をPosgtreSQLで管理し、nginxで実現するアプリ

## 目的 Purpose

ローカルサーバ上で、BASIC認証するWebページを作りたい。このとき、本アプリは以下の要件を実現する。

* ユーザ・パスワードを管理する際に .htaccess ファイルは直接更新しない。
* ディレクトリごとに異なる認証設定を実現する。

I want to create local web server with BASIC auth.

* Config User / Password without editing .htaccess file.
* Separete BASIC auth setting for each directory.

## ライセンス License

* プログラム・構成の本体は、 [WTFPL Version 2](LICENSE)として扱う。 \
  This app is under WTFPL Version 2.
* 関連するアプリは、各々のライセンスに従う。 \
  This app uses many software. They have their own license.
  * [Ubuntu Linux](https://jp.ubuntu.com/)
  * [Docker](https://www.docker.com/ja-jp/)
  * [PostgreSQL](https://www.postgresql.org/)
  * [NGINX](https://www.nginx.com/)
  * [Node.js](https://nodejs.org/en)
    * [Express](https://expressjs.com/ja/)
    * [Node-Postgres](https://node-postgres.com/)
  * [Tabulator](https://tabulator.info/)
  * [Debian Linux](https://www.debian.org/)

## 制限 Limitation

本アプリはセキュリティを考慮しない設計としている。 \
したがって、パブリッククラウド等インターネットからのアクセスが物理的に可能なネットワーク構成は想定しない。

This app contains Vulnerability. \
Never use with public communication lines, such as the Internet.

本アプリをインターネット上で使いたい場合は適宜カスタマイズを行うこと。
本アプリは、そのためにWTFPLを採用している。

WTFPL License allows you any change of this app.

## インストール手順 How to Install (Only in Japanese language.)

1. Docker（Docker Compose を含む）をインストールする。 \
   [Docker公式サイトのインストール手順書](https://docs.docker.com/engine/install/) を参照して実施する。

1. 本アプリをインストールする。

   ```bash
   git clone https://github.com/stageleft/nginx_user_admin_ui.git
   ```

1. 本アプリをカスタマイズする。詳細は後段に記載。

1. 本アプリを実行する。

   ```bash
   docker compose build && docker compose up -d
   ```

5. 本アプリの停止方法は以下の通り。

   ```bash
   docker compose down
   ```

## 現状サンプル設定での使い方 How to use without change (Only in Japanese language.)

* `http://<サーバのIPアドレス>/` にて、BASIC認証の対象外となる静的HTMLファイルを表示
  * 本アプリ用に差し替えた nginx 標準のデフォルトwebページを表示する。
* `http://<サーバのIPアドレス>/sysadmin/` にて、BASIC認証の対象となる静的HTMLファイルを表示
  * 作成した html ファイルを表示する。詳細は sysadmin ディレクトリを参照。
* `http://<サーバのIPアドレス>/webadmin/` にて、BASIC認証の対象となるExpress UI/APIサービスを提供。
  * ボタン等操作方法は以下の通り。
    * ボタン「ユーザ一覧読み出し」で、現在PostgreSQLに入っているデータを表に反映する。
    * ボタン「末尾に空行追加」で、表の一番下に、空っぽの行を追加する。
    * ボタン「CSVダウンロード」で、現在の表の状態をCSVファイルとしてダウンロードする。
    * ボタン「フィルタ初期化」で、下記の表のフィルタ文字列を全て削除する。
    * ボタン「設定適用（Webサーバ再起動）」で、現在PostgreSQLに入っているデータをWebサーバに反映する。
  * 表の読み方は以下のとおり。
    * グループ：ユーザ名とパスワードを適用する、locationのグループを文字列で管理する。
      * サンプルでは、 `sysadmin_passwd` と `webadmin_passwd` を準備している。
    * ユーザ名：BASIC認証のユーザ名を入力する。
    * パスワード：BASIC認証のパスワードを入力する。
    * 摘要：BASIC認証のコメント欄を入力する。
    * 削除ボタン：当該の行のデータを、画面およびPostgreSQLから削除する。
  * 表のデータは編集可能であり、基本的には編集と同時にPostgreSQLに反映される。
    * ただし、グループ名・ユーザ名・パスワードが揃っていない場合はPostgreSQLへの反映は失敗する。これらを揃えるように入力すること。
    * 一度入力したグループ名・ユーザ名を変更した場合は、画面とPostgreSQLが不一致となる。「ユーザ一覧読み出し」ボタンをクリックして再一致化すること。

## プラットフォームのカスタマイズ How to change password of Postgres (Only in Japanese language.)

セキュリティの都合上、 `compose.yaml` ファイルを編集し、各コンテナのパスワード要素は変更しておく必要がある。

```yaml
environment:
  - POSTGRES_PASSWORD=mysecretpassword
```

なお、上記パスワードは、 PostgreSQL コンテナと通信する全てのコンテナで統一する必要があるため、全ての箇所で変更すること。

## アプリのカスタマイズ（nginxコンテナ設定の変更） How to customize NGINX settings(Only in Japanese language.)

NGINX設定ファイル （`nginx/sample.conf` ファイル）を適宜変更することで、Webサーバ一般の設定を、（nginxの機能の範囲内で）自由に設定することができる。\
ただし、他のコンテナの設定をNGINXに合わせて変更する必要がある。\
以下は一例。

### HTTPS 対応 How to enable HTTPS (Only in Japanese language.)

[HTTPS設定方法](http://nginx.org/en/docs/http/configuring_https_servers.html) に従い、HTTPSサーバとして構築することが可能。

本アプリを用いて、インターネットからのアクセスを行う際は必須の設定となる。（HTTP通信だと、BASIC認証パスワードが生で流れるため）

ただし、サーバ名および証明書の管理手順を確立する必要が別途発生する。素直に考えると Dockerfile で証明書を取り込む方法が考えられるが、定期的なコンテナリビルドが必要となる。

### ディレクトリの追加・構成変更 How to change HTML settings. (Only in Japanese language.)

NGINX設定に location を追加することで、Webサーバ上で公開するディレクトリの構成を変更することができる。

必要な設定は以下の通り。
NGINX の設定に従い、以下の設定を行う。必要に応じて、 `compose.yaml` ファイルも適宜変更する。

* `nginx/sample.conf` ファイルを編集し、location 要素を追加する。location要素の中身は以下の通りとする。
  * HTMLファイルの場合は、 root要素とindex要素を追加する。
    * `compose.yaml` にボリューム（ディレクトリ）共有の設定を追加する。
  * Webアプリの場合は、 proxy_pass 要素を追加する。
    * `compose.yaml` にWebアプリコンテナの設定を追加する。
  * 共通要素として、 auth_basic 要素を追加する。値は自由に設定できる。
  * 共通要素として、 auth_basic_user_file 要素を追加する。\
    ファイルのディレクトリは `/etc/nginx/conf.d/` とし、拡張子は `.sec` とする。\
    ファイル名の本体部分は、サンプルの編集UIにおける「グループ」の文字を設定する。
    例）グループ sysadmin_passwd に対するauth_basic_user_fileは `/etc/nginx/conf.d/sysadmin_passwd.sec` とする。
    * 設定反映前に、 PostgreSQL にて、上記グループに対する、ユーザ名・パスワードの設定を追加する。\
      初期の起動前であれば、 `postgres/init/init-user-db.sh` の `INSERT INTO userfile (file, username, password)` 設定を追加する。 \
      一度でもアプリを利用したことがあれば、サンプルの編集UIにて、グループ名・ユーザ名・パスワード入力画面にて追加入力しておく。
