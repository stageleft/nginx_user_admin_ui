# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ Webadmin コンテナ設計

本コンテナを設計するにあたり、ベースイメージとして [Docker公式のNode.jsイメージ](https://hub.docker.com/_/node) を用いる。

## Docker設定（compose.yaml）

* ビルド、コンテナ名についてはディレクトリ構成を参照。
* コンテナ外との通信について、考え方は全体設計を参照。
  * `dbserver` に対しては、Docker内ネットワーク `localwebnw` を設定する。
  * `webserver` に対しては、以下の２つを設定する。
    * `webserver` からのポーティングについては、Docker内ネットワーク `localwebnw` を設定する。
    * `webserver` コンテナの再起動操作については、ホスト上の Unix Socket ファイル `/var/run/docker.sock` をボリュームとしてマウントする。
  * 外部との通信は直接行わない（nginxコンテナを通す）。
* 環境変数については以下の通り。
  * `POSTGRES_` 系の環境変数については、通信先SQLサーバである `dbserver` コンテナの設定に従う。
* コンテナ終了時、即座に再起動する設定を入れておく。

上記を実現した設定が以下の通りとなる。

```yaml
  webadmin:
    build: ./webadmin/.
    container_name: 'webadmin'
    networks:
      - localwebnw
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - POSTGRES_SERVER=【dbserverの設定による】
      - POSTGRES_PORT=【dbserverの設定による】
      - POSTGRES_DB=【dbserverの設定による】
      - POSTGRES_USER=【dbserverの設定による】
      - POSTGRES_PASSWORD=【dbserverの設定による】
    restart: always
```

## 機能一覧

* GET /
  * 追加パラメータなし
  * BASIC認証の編集画面 `public/index.html` を取得する。
* GET /api/
  * 追加パラメータなし
  * BASIC認証の、グループ・ユーザ・パスワード・摘要の一覧を JSON 形式で取得する。

    ```json
    [
      {
        file: 'グループ名',
        username: 'ユーザ名',
        password: 'パスワード',
        comment: '摘要'
      },{
        ...
      }
    ]
    ```

* POST /api/
  * 追加パラメータは、 Body に Post する。

    ```json
    {
      file: 'グループ名',
      username: 'ユーザ名',
      password: 'パスワード',
      comment: '摘要'
    }
    ```

  * BASIC認証の、グループ・ユーザ・パスワード・摘要を１件追加する。
* PUT /api/
  * 追加パラメータは、 Body に Post する。

    ```json
    {
      file: 'グループ名',
      username: 'ユーザ名',
      password: 'パスワード',
      comment: '摘要'
    }
    ```

  * BASIC認証の、グループ・ユーザ が一致するレコードに対して、 パスワード・摘要の値を更新する。
* DELETE /api/
  * 追加パラメータは、 Body に Post する。

    ```json
    {
      file: 'グループ名',
      username: 'ユーザ名'
    }
    ```

  * BASIC認証の、グループ・ユーザ が一致するレコードを削除する。
* POST /api/restart
  * 追加パラメータは、 Body に Post する。

    ```json
    {
      container: 'コンテナ名'
    }
    ```

  * パラメータに指定されたコンテナ名のコンテナを再起動する。
