# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ 設計

## 構成設計

* OS : Ubuntu Linux ※Linux依存はともかくディストリ依存は最小化するため、Dockerさえあればなんとかなるように構成する。
  * アプリ ： [Docker](https://www.docker.com/ja-jp/)をベースにする。コンテナは以下。
* コンテナ
  * `dbserver` : [PostgreSQL](https://www.postgresql.org/)
  * `webserver` : [nginx](https://www.nginx.com/)
    * 起動時、Basic認証のユーザ・パスワードファイルをデータベース経由で生成するための自作アプリを含む。
    * 起動時、HTTPSで用いる秘密鍵および公開鍵証明書をデータベース経由で取得するための自作アプリを含む。
    * 置き換え用のホームページ（HTMLファイル）を含む。
  * `webadmin` : DBアクセスUI/APIアプリ
    * BASIC認証の設定変更を反映するため `webserver` の再起動を行う機能を含む。
  * （あとでやりたい） `sysadmin` : html（ホームページ本体）\
    ホームページ群（HTMLファイル）を抱えておき、data volume を経由して nginxに見せる用。権限設定がうまくいかず、 webserver に抱えたほうが早いのでいったん削除。
  * （あとでやりたい）証明書管理UI/APIアプリ
* Docker内（コンテナ間、datavol）通信
  * `dbserver` まわりの通信
    * ホスト上ファイルシステムとの通信（データベースのバックアップ）： volume
    * `webserver` との通信： network(SQL)
    * `webadmin` との通信： network(SQL)
  * `webserver` まわりの通信
    * ホスト上ファイルシステムとの通信：不要
    * `dbserver` との通信： network(SQL)
    * `webadmin` との通信： network(HTTP)
  * （特記事項） `webadmin` まわりの通信にて上記以外
    * ホスト上Dockerとの通信：UNIXソケット `/var/run/docker.sock`
* Docker外通信
  * `webserver` まわりの通信：HTTP(port:80) ※HTTPS(port:443)は非対応。README.mdに記載のとおりのカスタマイズをユーザ責任で実施。
  * その他の通信：不要

## プラットフォームの開発用操作メモ

### Docker Composeの確認・操作

* 開発での Docker compose の実行

  ```bash
  docker compose down && docker compose build && docker compose up
  ```

* コンテナ類の状態の確認コマンド

  ```bash
  docker images
  docker network ls
  docker volume ls
  docker ps -a --no-trunc
  ```

* コンテナのログ確認コマンド（コンテナが異常終了してるとき）

  ```bash
  docker logs <container-name>
  ```

* コンテナ内に入って確認（コンテナが稼働しているとき）

  ```bash
  docker exec -it <container-name> bash
  ```

  上記を実施するには、対象コンテナが debian または ubuntu ベースで作成されている必要がある。
  * 公式コンテナの、タグ `-bookworm` など。タグ `-alpine` で alpine linux ベースにしてるときは bash がないので sh などを指定する。操作が大変。
  * 自作コンテナの、`FROM debian:latest` など。
