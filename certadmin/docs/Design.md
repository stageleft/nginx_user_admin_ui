# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ Certadmin コンテナ設計

本コンテナを設計するにあたり、ベースイメージとして [Docker公式のNode.jsイメージ](https://hub.docker.com/_/node) を用いる。

## Docker設定（compose.yaml）

* ビルド、コンテナ名についてはディレクトリ構成を参照。
* コンテナ外との通信について、考え方は全体設計を参照。
  * `dbserver` に対しては、Docker内ネットワーク `localwebnw` を設定する。
  * `webserver` に対しては、以下の２つを設定する。
    * `webserver` からのポーティングについては、Docker内ネットワーク `localwebnw` を設定する。
    * `webserver` コンテナの再起動操作については、ホスト上の Unix Socket ファイル `/var/run/docker.sock` をボリュームとしてマウントする。\
      `webadmin` と機能が被るものの、モジュールとしての独立性を優先する。
  * 外部との通信は直接行わない（nginxコンテナを通す）。
* 環境変数については以下の通り。
  * `POSTGRES_` 系の環境変数については、通信先SQLサーバである `dbserver` コンテナの設定に従う。
  * `CSRINFO_` 系の環境変数として、以下９つの環境変数を定義し、証明書署名要求 certificate signing request に用いる。
    * 国名 Country Name (2 letter code) [AU]
    * 都道府県名 State or Province Name (full name) [Some-State]: ※直訳は「州」。都道府県の直訳 (prefecture) とは合わないが、近い概念がこれしかない。
    * 市名 Locality Name (eg, city) []:
    * 組織（企業）名 Organization Name (eg, company) [Internet Widgits Pty Ltd]
    * 組織内部門名 Organizational Unit Name (eg, section) []:
    * 名称 Common Name (e.g. server FQDN or YOUR name) []:
    * 電子メールアドレス Email Address []:
    * パスワード A challenge password []:
    * 関連会社名？ An optional company name []:
  * `SELFROOTCA_` 系の環境変数として、以下１つの環境変数を定義し、 ルートCA証明書 root CA certificate の作成に用いる。
    * 証明書の期日

* コンテナ終了時、即座に再起動する設定を入れておく。

上記を実現した設定が以下の通りとなる。

```yaml
  certadmin:
    build: ./certadmin/.
    container_name: 'certadmin'
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
      - CSRINFO_COUNTRY=JP
      - CSRINFO_STATE=Tokyo
      - CSRINFO_CITY=
      - CSRINFO_ORG=
      - CSRINFO_DIV=
      - CSRINFO_CN=
      - CSRINFO_MAIL=
      - CSRINFO_CHALLENGE=
      - CSRINFO_OPT_ORG=
      - SELFROOTCA_DAYS=400
    restart: always
```

## 機能一覧

* GET / \
  証明書設定のホームページを取得する。
  * (req) 追加パラメータなし
  * (res) 証明書設定の編集画面 `public/index.html`。

* GET /api/ \
  証明書の管理パラメータ各種を取得する。デジタル鍵および公開鍵証明書の本体は取得できないので、後述のAPIを個別にコールすること。
  * (req) 追加パラメータなし
  * (res) 下記の JSON データを取得する。ファイル本体は対象外とする。

    ```json
    [
      {
        "file_id": "ファイルのID",
        "key_id": "ファイルのID",
        "root_id": "ファイルのID",
        "file_name": "ファイル名",
        "data_type": "データ種別",
        "comment": "摘要",
        "is_prikey_entity": "prikey_entityにファイルがあるかどうか（true/false）", 
        "is_pubkey_entity": "pubkey_entityにファイルがあるかどうか（true/false）", 
        "is_cert_entity": "cert_entityにファイルがあるかどうか（true/false）", 
      },{
        ...
      }
    ]
    ```

    * 上記 `is_prikey_entity` はデータベースで直接は管理していないので、APIで算出してコール元に返す。
    * 上記 `is_pubkey_entity` はデータベースで直接は管理していないので、APIで算出してコール元に返す。
    * 上記 `is_cert_entity` はデータベースで直接は管理していないので、APIで算出してコール元に返す。

* GET /api/primarykey \
  秘密鍵ファイル本体を取得する。
  * (req) 追加パラメータは query に設定する。\
    `file_id=${file_id}`
  * (res) 下記の JSON データを取得する。ファイル本体のバイナリデータは `UINT8Array` オブジェクトの形式で取得する。

    ```json
    {
      "file_name": "ファイル名",
      "prikey_entity": "秘密鍵ファイル本体のバイナリデータ"
    }
    ```    

* GET /api/publickey \
  公開鍵ファイル本体を取得する。
  * (req) 追加パラメータは query に設定する。\
    `file_id=${file_id}`
  * (res) 下記の JSON データを取得する。ファイル本体のバイナリデータは `UINT8Array` オブジェクトの形式で取得する。

    ```json
    {
      "file_name": "ファイル名",
      "pubkey_entity": "公開鍵ファイル本体のバイナリデータ"
    }
    ```    

* GET /api/certfile \
  公開鍵証明書ファイル本体を取得する。
  * (req) 追加パラメータは query に設定する。\
    `file_id=${file_id}`
  * (res) 下記の JSON データを取得する。ファイル本体のバイナリデータは `UINT8Array` オブジェクトの形式で取得する。

    ```json
    {
      "file_name": "ファイル名",
      "cert_entity": "公開鍵証明書ファイル本体のバイナリデータ"
    }
    ```    

* POST /api/ \
  新規に、証明書の管理パラメータ各種を登録する。デジタル鍵および公開鍵証明書の本体は登録できないので、後述のAPIを個別にコールすること。
  * (req) 下記の JSON を Body とする。 `file_id` は自動採番のためPost対象外とする。

    ```json
    {
      "key_id": "ファイルのID",
      "root_id": "ファイルのID",
      "file_name": "ファイル名",
      "data_type": "データ種別",
      "comment": "摘要"
    }
    ```

  * (res) 応答データなし。

* POST /api/primarykey \
  秘密鍵ファイル本体を登録する。
  * (req) 下記の JSON を Body とする。ファイル本体のバイナリデータは `UINT8Array` オブジェクトの形式で設定する。

    ```json
    {
      "file_id": "ファイルのID",
      "prikey_entity": "秘密鍵ファイル本体のバイナリデータ"
    }
    ```    

  * (res) 応答データなし。

* POST /api/publickey \
  公開鍵ファイル本体を登録する。
  * (req) 下記の JSON を Body とする。ファイル本体のバイナリデータは `UINT8Array` オブジェクトの形式で設定する。

    ```json
    {
      "file_id": "ファイルのID",
      "pubkey_entity": "公開鍵ファイル本体のバイナリデータ"
    }
    ```    

  * (res) 応答データなし。

* POST /api/certfile \
  公開鍵証明書ファイル本体を登録する。
  * (req) 下記の JSON を Body とする。ファイル本体のバイナリデータは `UINT8Array` オブジェクトの形式で設定する。

    ```json
    {
      "file_id": "ファイルのID",
      "cert_entity": "公開鍵証明書ファイル本体のバイナリデータ"
    }
    ```    

  * (res) 応答データなし。

* POST /api/generate_keypair \
  デジタル鍵ペア（秘密鍵と公開鍵のペア）を生成する。データ種別が `keypair` かつ、デジタル鍵ペアが両方とも未登録の場合に限る。
  * (req) 下記の JSON を Body とする。

    ```json
    {
      "file_id": "ファイルのID",
    }
    ```    

  * (res) 応答データなし。

* POST /api/generate_selfca \
  デジタル鍵ペアをもとに、ルート証明書を生成する。
  * 実行条件は、指定した `file_id` および関連項目について、以下の通り。
    * `file_id` に指定したテーブルのデータ種別が `root_selfca` であること。
    * 証明書が未登録であること。
    * `key_id` が登録されていること。 `key_id` に指定したデジタル鍵ペアについて以下のとおりであること。
      * 秘密鍵、公開鍵、ともに登録されていること。
  * (req) 下記の JSON を Body とする。

    ```json
    {
      "file_id": "ファイルのID",
    }
    ```    

  * (res) 応答データなし。


* PUT /api/ \
  既存の証明書の管理パラメータ各種を更新する。デジタル鍵および公開鍵証明書の本体は更新できないので、前述の POST API を個別にコールすること。
  * (req) 下記の JSON を Body とするが、そのうち `file_id` の部分は、更新対象のレコードを特定するために用いる。
  * (req) 下記の JSON を Body とするが、上記それ以外の部分は更新対象のデータとする（更新するものだけ設定すればよい）。

    ```json
    {
      "file_id": "ファイルのID",
      "key_id": "ファイルのID",
      "root_id": "ファイルのID",
      "file_name": "ファイル名",
      "data_type": "ユーザ名",
      "comment": "摘要"
    }
    ```

  * (res) 応答データなし。

* DELETE /api/ \
  既存の証明書の管理パラメータおよび本体を削除する。デジタル鍵および公開鍵証明書の本体も合わせて削除する。
  * (req) 下記の JSON を Body とし、削除対象のレコードを特定するために用いる。

    ```json
    {
      "file_id": "ファイルのID"
    }
    ```

  * (res) 応答データなし。

* POST /api/restart \
  コンテナを再起動する。 \
  本設計書では、 webserver を再起動させて証明書をDBから取り込ませることを想定するが、用途はそれに限らない。
  * (req) 下記の JSON を Body とし、再起動対象のコンテナ名を指定する。

    ```json
    {
      "container": "コンテナ名"
    }
    ```

  * (res) 応答データなし。

## 調査

証明書署名要求 certificate signing request を手作業で作る場合、以下のとおり９つのパラメータを要求される。

```bash
$ openssl req -new -sha256 -key prikey.key -out pubkey.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:JP
State or Province Name (full name) [Some-State]:Tokyo
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:MyCompany
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```
