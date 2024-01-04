# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ Sysadmin コンテナ設計

本コンテナを設計するにあたり、ベースイメージとして [Docker公式のDebianイメージ](https://hub.docker.com/_/debian) を用いる。

## Docker設定（compose.yaml）

* ビルド、コンテナ名についてはディレクトリ構成を参照。
* コンテナ外との通信について、考え方は全体設計を参照。
  * `webserver` に対して、ボリューム `sysadminhtml` を共有してHTMLファイルを共有する。
  * 外部との通信は直接行わない（nginxコンテナを通す）。
* 環境変数については以下の通り。
  * 特段の設定項目なし。
* コンテナ終了時、即座に再起動する設定を入れておく。

上記を実現した設定が以下の通りとなる。

```yaml
  sysadmin:
    build: ./sysadmin/.
    container_name: 'sysadmin'
    volumes:
      - type: volume
        source: sysadminhtml
        target: /usr/share/nginx/html/sysadmin
    restart: always
```

## コンテナ内に追加するファイルの構成

* /init.sh : コンテナを稼働させ続けるための起動スクリプト。他の機能は不要である。
* /usr/share/nginx/html/sysadmin : 共有するHTMLファイル群。本リポジトリとしては `public` ディレクトリとして保存する。
  * index.html
