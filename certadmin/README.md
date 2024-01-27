# Basic認証の設定（主にユーザとパスワード）をPosgtreSQLで管理し、nginxで実現するアプリ Certadmin コンテナについて

## 本コンテナの目的 Purpose

本コンテナは、[アプリ全体](../README.md) で示した機能のうち、HTTPS（公開鍵基盤）で用いる、秘密鍵・証明書署名要求（公開鍵）・公開鍵証明書を管理するWeb画面およびWebAPIを、サンプル機能として提供する。

This app provides a web browser interface and a web API for managing HTTPS/PKI certificate and keys as a sample source code.

## ライセンス License

[アプリ全体](../README.md) を参照。

see [document of this app](../README.md).

## 画面説明 How to use this web browser interface without change (Only in Japanese language.)

* `http://<サーバのIPアドレス>/certadmin/` にアクセスする。\
  BASIC認証によりユーザー名、パスワードを聞かれるので、以下のとおり入力してログインする。\
  ユーザー名： `certadmin`\
  パスワード： `certpass`\
* ログインできた直後の画面（ホーム画面）は以下の通り。 \
  <img src="./docs/01_home.png" width="640" alt="ホーム画面">
* 上記画面から、公開鍵証明書類を管理する画面と、証明書利用要求を管理する画面に各々遷移する。

### 画面説明（公開鍵証明書類管理）

* ホーム画面から、 `certfiles` メニューをクリックして、以下の証明書類管理画面に遷移する。 \
  <img src="./docs/02_01_certfiles.png" width="640" alt="証明書類管理画面">
* ボタン「鍵および証明書一覧読み出し」で、現在データベースに入っているデータを表に反映する。\
  <img src="./docs/02_02_certfiles_default.png" width="640" alt="初期・鍵および証明書一覧読み出し直後の状態">\
  上記画面の全体像は以下の通り。\
  <img src="./docs/02_03_certfiles_default_70percent.png" width="640" alt="初期・鍵および証明書一覧読み出し直後の状態">
* 操作メニューの内容は以下の通り。
  * 表の上のボタン操作方法は以下の通り。
    * 鍵および証明書一覧読み出し： データベース上で管理している、正のデータを表に反映する。
    * 末尾に空行追加：表の一番下に、空っぽの行を追加する。データを新規追加するために用いる。
    * CSVダウンロード：現在、表示されているの表をCSVファイルとしてダウンロードする。
    * フィルタ初期化：下記の表のフィルタ文字列を全て削除する。
  * 表の項目名の部分では、フィルタとして表示する行を絞り込むことができる。
  * 表の項目操作について、可能な内容は以下の通り。
    * ファイルID：操作不可（登録した際に自動発番される）
    * 生成元鍵ファイルID：連携先（利用する／利用した鍵）の、上記ファイルIDの数字を直接入力する。\
      下記、ファイル種別が `root_selfca`、`selfcert`、`cacert`の場合に用いる。
    * 生成元証明書ファイルID：連携先（利用する／利用した証明書）の、上記ファイルIDの数字を直接入力する。\
      下記、ファイル種別が `selfcert` の場合に用いる。
    * ファイル名（FQDN）：鍵あるいは証明書ファイルの名前に用いる。\
      証明書署名要求を作成する際の共通名（CN; Common Name）にも用いるため、必要に応じてnginxコンテナの設定と合わせること。
    * ファイル種別：以下４つのパラメータいずれかを選択する。
      * `keypair` 秘密鍵、および、ペアとなる証明書署名要求を管理する。
      * `root_selfca` ルート証明書を管理する。
      * `selfcert` 自己署名証明書を管理する。
      * `cacert` CA署名証明書を管理する。
    * 秘密鍵登録済み？：上記ファイル種別が`keypair`の場合に限り利用でき、以下の操作が可能。
      * 値が `true` の場合、クリックすることで秘密鍵 `filename.key` をダウンロード可能。
      * 値が `false` の場合、ファイルをドラッグ＆ドロップすることで秘密鍵を登録可能。
      * 値が `false` かつ下記「公開鍵登録済み？」も合わせて`false`の場合、クリックすることで秘密鍵および証明書署名要求を生成可能。
    * 公開鍵登録済み？：上記ファイル種別が`keypair`の場合に限り利用でき、以下の操作が可能。
      * 値が `true` の場合、クリックすることで証明書署名要求 `filename.csr` をダウンロード可能。
      * 値が `false` の場合、ファイルをドラッグ＆ドロップすることで証明書署名要求を登録可能。
      * 値が `false` かつ上記「秘密鍵登録済み？」も合わせて`false`の場合、クリックすることで秘密鍵および証明書署名要求を生成可能。
        * 生成される証明書署名要求について、CNは上記ファイル名、その他の情報は起動時の環境変数を用いる。 [設計情報](./docs/Design.md) を参照。
    * 証明書登録済み？：上記ファイル種別が`root_selfca`、`selfcert`、`cacert`の場合に限り利用でき、以下の操作が可能。
      * 値が `true` の場合、クリックすることで公開鍵証明書 `filename.crt` をダウンロード可能。
      * 値が `false` の場合、ファイルをドラッグ＆ドロップすることで、公開鍵証明書を登録可能。
      * （ファイル種別が`root_selfca`の場合の機能）値が `false` かつ上記「生成元鍵ファイルID」が適切に設定されている場合、クリックすることでルート証明書を生成可能。
      * （ファイル種別が`selfcert`の場合の機能）値が `false` かつ上記「生成元鍵ファイルID」「生成元証明書ファイルID」が適切に設定されている場合、クリックすることで自己署名証明書を生成可能。
    * 摘要：メモを自由に入力可能。ただし、上記機能を用いて鍵や証明書を自動生成した場合に、自動生成したファイルにかかわる情報に置き換わる。
    * 更新ボタン：入力した情報にて、当該行を更新する。ただし、入力した情報が不適切な場合は更新に失敗する。\
      なお、更新の成否にかかわらず、更新操作後は表のすべての部分がデータベースの情報に置き換わるので、複数行の一斉入力は不可。
    * 削除ボタン：当該行を削除する。
      削除した行を「生成元ファイルID」あるいは「生成元証明書ファイルID」に指定していた行も合わせて削除する。

なお、誤操作は全く考慮していないので、ファイル生成・ファイル削除操作には注意が必要。

#### 画面操作シナリオ１・自己署名証明書の作成

1. ルート証明書に用いるための秘密鍵および証明書署名要求を生成する。
   1. 末尾に空行を追加する。ファイル種別は `keypair` のままとする。 \
      <img src="./docs/02_10_create_record.png" width="640" alt="">
   1. ルート証明機関のファイル名（FQDN）を記載する。今回は `oreore` とする。 \
      <img src="./docs/02_11_add_fqdn.png" width="640" alt="">
   1. 更新ボタンを押下し、管理情報を登録する。 \
      <img src="./docs/02_12_commit_type_fqdn.png" width="640" alt="">
   1. 「秘密鍵登録済み？」セルを押下する。秘密鍵および証明書署名要求が生成される。 \
      <img src="./docs/02_13_create_keypair.png" width="640" alt="">
1. ルート証明書を作成する。
   1. 末尾に空行を追加する。ファイル種別を変更し `root_selfca` とする。 \
      <img src="./docs/02_14_create_record.png" width="640" alt="">
   1. ルート証明機関のファイル名（FQDN）を記載する。鍵と合わせて `oreore` とする。 \
      <img src="./docs/02_15_add_fqdn.png" width="640" alt="">
   1. ルート証明書の生成に用いる、鍵ファイルのIDを記載する。 \
      <img src="./docs/02_16_add_keypair_id.png" width="640" alt="">
   1. 更新ボタンを押下し、管理情報を登録する。 \
      <img src="./docs/02_17_commit_type_fqdn_keypair.png" width="640" alt="">
   1. 「秘密鍵登録済み？」セルを押下する。ルート証明書が生成される。 \
      <img src="./docs/02_18_create_rootca.png" width="640" alt="">

1. 自己署名証明書に用いるための秘密鍵および証明書署名要求を生成する。
   1. 末尾に空行を追加する。ファイル種別は `keypair` のままとする。 \
      <img src="./docs/02_20_create_record.png" width="640" alt="">
   1. 自サイトのファイル名（FQDN）を記載する。今回は `oredayo` とする。 \
      <img src="./docs/02_21_add_fqdn.png" width="640" alt="">
   1. 更新ボタンを押下し、管理情報を登録する。 \
      <img src="./docs/02_22_commit_type_fqdn.png" width="640" alt="">
   1. 「秘密鍵登録済み？」セルを押下する。秘密鍵および証明書署名要求が生成される。 \
      <img src="./docs/02_23_create_keypair.png" width="640" alt="">
1. 自己署名証明書を作成する。
   1. 末尾に空行を追加する。ファイル種別を変更し `root_selfca` とする。 \
      <img src="./docs/02_24_create_record.png" width="640" alt="">
   1. 自サイトのファイル名（FQDN）を記載する。鍵と合わせて `oredayo` とする。 \
      <img src="./docs/02_25_add_fqdn.png" width="640" alt="">
   1. 自己署名証明書の生成に用いる、鍵ファイルのIDを記載する。 \
      <img src="./docs/02_26_add_keypair_id.png" width="640" alt="">
   1. 自己署名証明書の認証機関となる、ルート証明書ファイルのIDを記載する。 \
      <img src="./docs/02_27_add_rootca_id.png" width="640" alt="">
   1. 更新ボタンを押下し、管理情報を登録する。 \
      <img src="./docs/02_28_commit_type_fqdn_keypair_rootca.png" width="640" alt="">
   1. 「秘密鍵登録済み？」セルを押下する。自己署名証明書が生成される。 \
      <img src="./docs/02_29_create_rootca.png" width="640" alt="">

なお、上記手順は https://learn.microsoft.com/ja-jp/azure/application-gateway/self-signed-certificates に基づいている。

#### 画面操作シナリオ２・CA署名証明書の購入管理

1. CA署名証明書を用いるための秘密鍵を生成する。\
    ここでは、パスフレーズに `wareware_pass` を入れて `wareware.key` を生成する。

    ```bash
    $ openssl genrsa -des3 -out wareware.key 2048
    Generating RSA private key, 2048 bit long modulus (2 primes)
    ...............+++++
    ......................................................................................................................+++++
    e is 65537 (0x010001)
    Enter pass phrase for wareware.key:
    Verifying - Enter pass phrase for wareware.key:
    ```

    生成された秘密鍵は以下の通り。

    ```bash
    $ cat wareware.key
    -----BEGIN RSA PRIVATE KEY-----
    Proc-Type: 4,ENCRYPTED
    DEK-Info: DES-EDE3-CBC,30E47784F1A8AA8A

    pxZwtxWv8idBL39i4JPtXN10o9+IDCZbmlwWj2f6agcA8o3pROi8BQblDwZcxgZW
    ESElhdbeVlYp5lt71pv4ytmziX+cFB3rJIZBKxbhl8aQxM5LtK1sR96MNTwzgeBx
    /hdRUiIgbkUFvmwljzTc3yy18bAkTtQlCtv/3jE/zUoULywcW3WWh7rOht66lpVh
    PQlnDY1/OrMVZQxil7LVwZmmoSr5G5rYPBIduzypJwEwNN+D12FGJVF8SypLz/UR
    t2X0Pc+bV3pLdMzSUB045FOloW1pdq87utQvQy7eyFqYcvlG3i2CH6GaSFQOx93w
    6Ew2UzYn8cqSUZlzfDK/4Sudx/8/CyPysil5lQ0VBRpZ6fcmNTmzFs5W0mAKskjS
    kFv8bJK9Je00rjhVRRjtpmHHBy3H+chgkYBRCPrXycIx4FmC1RO6eZTks6NPrifo
    yNWIYg51PNwvm7fkTNxBc7Kjpzx82VTY1wWP6mCyS7Gv2fWwaLiQh/fGTc4fkRx/
    cAGl8xrKcANUP6HRVEn5WMrBQv12EMohPXoWdKerahKHUOSJw8L3rC01aS307uZP
    oWIaLQFKjUHFiaiq54t+h+ElpGUOcYPdSPQeJzRqRUlM9TiIzJRPoYTMV0ghBKCl
    ZHyojgWUh3a7iSK8Lvoj6q+wq+XRTecX1GSVvewTfYrX2dMYAO9RQigTYP0hCOnq
    mRb4XRtrLXNwU3R4UfI1ihyp7pAViFk1AGPNHzXX8rfK9iF1I3CG/1F2yDwY1n5J
    F+u4+m9/4WK/S4Oa1/QGt7apRWGbjdy1Z5JAM1Epm96n9WsF56PB6eqvG6PBOgYl
    VpCRZ/5PeNU0+kXRTGp5DRw3O8b+Zaigv+WLdmx+7uLTj8Cv7HZr5OvSl3pS2fKs
    aHg8vsg4ifPlxXyhslG+bZsLUIkq0ocRcrCUSklUZYYGvmyeCkLDaS7PrCz6KVVG
    V9smuE/BT2T8+fGPbB7TlL9u8B0hzkFIKrD+ngpWwfi/c8DfUu9WTrCcRJFP50fZ
    R7DKTmxVvuhnYNgCUsjncfLVuR9Zy7Zns5Z7PyeVdT9VPVqqrIU18MxXI0LfdRak
    CS91ScKtgRe10BwrlJzJ/8f6aZUOJI1ZrNFippXzkdy78/Evle5iiWjJX8A2RAz/
    si4tDjlLX49/ET4SVF39K2u3/N2WxtjGijbDN4Bfz14NXQI6/NCVCa5HvA6Q373D
    QTTJZdcpsT55XLKS275vSUAk9hhOcfOXguOcY9wMKCQRKLXvDGuPQohqDoxsMocX
    XS1FhV5PiAGimMVX+ujLdMaEli6e0kTKET7aLmQ2VxaQeloBLjC9yHERhGnwcCa6
    hNl/nyO598nywlN/MRZavc4BRAM4GI59fYtRl4JCnvD0MYjdmueYFB1+EX/GSr8b
    xqLhqfnxpF8VMddUivVxWrP2AzMPQMQoWgDGHYEw3zNE21qYJ+XCLMN0DglIX6Ub
    yFBpDjBUCMRNnPdF9OO6ZFhsuaQHGijXhw+9vHv3rxJcixh8mTIxAtEBgHMrvFai
    iggYV5yClmFLb9kLgunWlk7KAfXj7HQBilG31EKqqJq1+XTgWYwsv6jdk9WKmEyD
    -----END RSA PRIVATE KEY-----
    ```

1. 上記秘密鍵を用いて、CA証明機関へ渡すための証明書署名要求を生成する。\
    `wareware.key` を用いて、 `wareware.csr` を生成する。

    ```bash
    $ openssl req -new -key wareware.key -out wareware.csr
    Enter pass phrase for wareware.key:
    You are about to be asked to enter information that will be incorporated
    into your certificate request.
    What you are about to enter is what is called a Distinguished Name or a DN.
    There are quite a few fields but you can leave some blank
    For some fields there will be a default value,
    If you enter '.', the field will be left blank.
    -----
    Country Name (2 letter code) [AU]:JP
    State or Province Name (full name) [Some-State]:Tokyo
    Locality Name (eg, city) []:TokyoCity
    Organization Name (eg, company) [Internet Widgits Pty Ltd]:MyCompany
    Organizational Unit Name (eg, section) []:MyDivision
    Common Name (e.g. server FQDN or YOUR name) []:wareware
    Email Address []:email@example.com

    Please enter the following 'extra' attributes
    to be sent with your certificate request
    A challenge password []:challengePassword
    An optional company name []:MyExtraDivision
    ```

    生成された証明書署名要求は以下の通り。

    ```bash
    $ cat wareware.csr
    -----BEGIN CERTIFICATE REQUEST-----
    MIIDFzCCAf8CAQAwgY8xCzAJBgNVBAYTAkpQMQ4wDAYDVQQIDAVUb2t5bzESMBAG
    A1UEBwwJVG9reW9DaXR5MRIwEAYDVQQKDAlNeUNvbXBhbnkxEzARBgNVBAsMCk15
    RGl2aXNpb24xETAPBgNVBAMMCHdhcmV3YXJlMSAwHgYJKoZIhvcNAQkBFhFlbWFp
    bEBleGFtcGxlLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPB3
    n3URHhWg+AalL4wH89RKb7mNWbWDa4ukTsm/fBVJWoE+PZ6sGz5QcRQDOZhN6lqf
    SNCQTXAn3VU1UJJdqNbNPLcQrAzN8aIs7NRukyC9ot1jG8h7DQ2uROL/ClgFmgjG
    DrHSpowCj5Lb+N8fT8c4xVNSnHia1u/efOdHgJwbgLLf1mBgH75h1bBUqz6+TOeM
    5SivGAOP6lFsiGQ8VrDGZxviqKBgZiyTeDrOs+/wp8xsQ81eQ0SuVL5nFo6AEpkS
    /rI4FOnPkVfc6gav1Q2xi5bKSjjyJihJw0djgqJ7gbajiSM/MjR/bxXLgtHQ9eE6
    9BP2XDpXv3gbkYRdUb8CAwEAAaBCMB4GCSqGSIb3DQEJAjERDA9NeUV4dHJhRGl2
    aXNpb24wIAYJKoZIhvcNAQkHMRMMEWNoYWxsZW5nZVBhc3N3b3JkMA0GCSqGSIb3
    DQEBCwUAA4IBAQCwTXkvyX2Ms4PoRvj3xmrKyVZ9JaOQPHk1bKE2nIvBPbK1l6LG
    xehVZdEXobbtmVno/6v4+wEAxP8WhKCdA0vshVkq7XXcbQnM+UBOmFxnRKklCw6I
    ZrDE5p4mlcCmgFg2HYrcMoVYbz/nofnbaJre4+ZNHQY4ScsRy6t3UnXOhQPMbjyy
    swsRg6kjeNT7ehk39fWlsLmsnFUL2twgB6q0W5JqD9jpO4fGUifbwqIG1AfbAwCa
    MamYywQ9M1P4Wsgw/aOinmgyrx5yNYhN87fuZPIAPVxh3uLo3/Y6bt6Dr/cj7O6j
    FXk7nDnlLeHnPfiYvY9ma6vVSCHwCt1unSwM
    -----END CERTIFICATE REQUEST-----
    ```

1. 上記証明書署名要求を用いて、認証局から、CA署名証明書を購入する。

ここまでの手順は本コンテナ無関係であり、 https://www.digicert.com/jp/tls-ssl/ssl-new-guide および https://knowledge.digicert.com/ja/jp/solution/SO23384 に基づいている。
証明書の管理について、以下のとおり本コンテナの機能を利用する。

1. CA署名証明書の購入要求に利用した秘密鍵および証明書署名要求を登録する。
   1. 末尾に空行を追加する。ファイル種別は `keypair` のままとする。
   1. 自サイトのファイル名（FQDN）を記載する。今回は `wareware` とする。
   1. 更新ボタンを押下し、管理情報を登録する。ここまでは鍵の自動生成と同じ手順である。 \
      <img src="./docs/02_40_commit_type_fqdn.png" width="640" alt="">
   1. 「秘密鍵登録済み？」セルへ、生成した秘密鍵ファイルをドラッグする。秘密鍵が登録される。 \
      <img src="./docs/02_41_add_prikey.png" width="640" alt="">
   1. 「公開鍵登録済み？」セルへ、生成した証明書署名要求ファイルをドラッグする。証明書署名要求が登録される。 \
      <img src="./docs/02_42_add_pubkey.png" width="640" alt="">
   1. その他、管理に必要な情報を「摘要」へ記入・登録しておく。 \
      <img src="./docs/02_43_add_comment.png" width="640" alt="">\
      ここではセキュリティ上の問題は無視して、秘密鍵のパスフレーズおよび証明書署名要求の各種情報\
      `PEM phrase = wareware_pass // subject=C = JP, ST = Tokyo, L = TokyoCity, O = MyCompany, OU = MyDivision, CN = wareware, emailAddress = email@example.com`\
      を入力した。画面は登録前であるが、その後「更新ボタン」を押して登録を完了している。

1. CA署名証明書を登録する。
   1. 末尾に空行を追加する。\
      ファイル種別を変更し `cacert` とする。 \
      自サイトのファイル名（FQDN）を記載する。鍵と合わせて `wareware` とする。 \
      認証局に送付した、鍵ファイルのIDを記載する。 \
      <img src="./docs/02_44_create_record.png" width="640" alt="">
   1. 上記入力後、更新ボタンを押下し、管理情報を登録する。
      <img src="./docs/02_45_commit_type_fqdn_keypair.png" width="640" alt="">
   1. 「証明書登録済み？」セルへ、購入したCA署名証明書ファイルをドラッグする。CA署名証明書が登録される。 \
      <img src="./docs/02_46_add_cacert.png" width="640" alt="">
   1. その他、管理に必要な情報を「摘要」へ記入・登録しておく。 \
      <img src="./docs/02_47_add_comment.png" width="640" alt="">\
      ここでは、認証局の情報および証明書の有効期限の情報\
      `CA = dummy_ca.example.com // expires 2024-01-30`\
      を入力した。画面は登録前であるが、その後「更新ボタン」を押して登録を完了している。

### 画面説明（公開鍵証明書利用要求）

* ホーム画面から、 `deploy` メニューをクリックして、以下の公開鍵証明書利用要求画面に遷移する。 \
  <img src="./docs/03_01_deployment.png" width="640" alt="ログイン成功直後の状態">
* ボタン「証明書一覧読み出し」で、現在データベースに入っているデータを表に反映する。\
  <img src="./docs/03_02_deployment_default.png" width="640" alt="証明書一覧読み出し直後の状態">\
  なお、本画面は初期値ではなく、上記「公開鍵証明書類管理」に説明の操作を一通り実施した後のものである。
* 以下、適宜操作を行い、グループ・ユーザー名・パスワードをお使いの状態に向けて変更していく。
  * 表の上のボタン操作方法は以下の通り。
    * 証明書一覧読み出し： データベース上で管理している、正のデータを表に反映する。
    * CSVダウンロード：現在、表示されているの表をCSVファイルとしてダウンロードする。
    * フィルタ初期化：下記の表のフィルタ文字列を全て削除する。
    * 新証明書適用（Webサーバ再起動）：Webサーバを再起動し、現在のデータベース上にある証明書を、本要求の実施後の状態に更新する。
  * 表の項目名の部分では、フィルタとして表示する行を絞り込むことができる。
  * 表のデータは、下記「デプロイ指示ボタン」のみ可能である。
    * 本表で表示される証明書類は「公開鍵証明書類管理」画面で表示されているものであるため、同画面を編集してから本画面を更新すること。
  * 表の読み方は以下のとおり。
    * ファイルID：「公開鍵証明書類管理」画面と同一。
    * ファイル名(FQDN)：「公開鍵証明書類管理」画面と同一。
    * ファイル種別：「公開鍵証明書類管理」画面と同一。ただし、`selfcert` および `cacert` のみ表示される。
    * 摘要：「公開鍵証明書類管理」画面と同一。
    * デプロイ指示時刻：下記「デプロイ指示時刻」が押下された時刻。\
      nginxコンテナは、各「ファイル名」ごとに最新のデプロイ指示時刻となる証明書を用いる。
    * デプロイ指示ボタン：当該行で管理する証明書の利用指示。\
      本コンテナの責務としては、上記デプロイ指示時刻の更新までを取り扱う。
    * ルート証明書ダウンロードボタン(自己署名証明書のみ)：\
      `selfcert` の場合、当該証明書に対応するルート証明書をダウンロードできる。\
      `cacert` の場合は、無意味なtickアイコンが表示されているだけのもの。

#### 画面操作シナリオ１・自己署名証明書の新規生成指示

CA署名証明書についても同様であるが、CA署名証明書の場合は後半の「お手持ちのブラウザへ、ルート証明書を登録する」の手順が不要となる。

事前状態として、 nginx コンテナは以下の通り、ファイルID:4の証明書のみを登録している。

```bash
$ docker exec -it webserver bash
root:/# cd /etc/nginx/conf.d
root:/etc/nginx/conf.d# ls -l
total 20
-rw-r--r-- 1 root root 117 Jan 27 03:50 certadmin_passwd.sec
-rw-r--r-- 1 root root 806 Jan 27 03:50 localhost.crt
-rw-r--r-- 1 root root 302 Jan 27 03:50 localhost.key
-rw-r--r-- 1 root root 906 Jan 27 03:33 sample.conf
-rw-r--r-- 1 root root 233 Jan 27 03:50 webadmin_passwd.sec
root:/etc/nginx/conf.d# sha1sum localhost.key
cfb058d23fad2ea18859d1d3abeb4db992a25015  localhost.key
root:/etc/nginx/conf.d# sha1sum localhost.crt
a0172c3b96557fe4c88e14187947f0411666cc1e  localhost.crt
```

1. デプロイ指示を行う
   1. 表内の「デプロイ指示ボタン」を押下する。今回はファイルID:9に対して実施した。\
      <img src="./docs/03_03_deployment_command.png" width="640" alt="デプロイ指示時刻が更新された状態">
   1. 表上部の「新証明書適用（Webサーバ再起動）」ボタンを押下する。押下後、画面の更新はない。
   1. （確認）しばらく待つとWebサーバが再起動し、新しい証明書を読み込む。読み込まれた状態は以下の通り。

      ```bash
      $ docker exec -it webserver bash
      root:/# cd /etc/nginx/conf.d
      root:/etc/nginx/conf.d# ls -l
      total 28
      -rw-r--r-- 1 root root 117 Jan 27 07:37 certadmin_passwd.sec
      -rw-r--r-- 1 root root 806 Jan 27 07:37 localhost.crt
      -rw-r--r-- 1 root root 302 Jan 27 07:37 localhost.key
      -rw-r--r-- 1 root root 786 Jan 27 07:37 oredayo.crt
      -rw-r--r-- 1 root root 302 Jan 27 07:37 oredayo.key
      -rw-r--r-- 1 root root 906 Jan 27 03:33 sample.conf
      -rw-r--r-- 1 root root 233 Jan 27 07:37 webadmin_passwd.sec
      root@fb54c4e586fc:/etc/nginx/conf.d# sha1sum oredayo.key 
      52a05558cf1e590086439bb778fb426f7f5b9aea  oredayo.key
      root@fb54c4e586fc:/etc/nginx/conf.d# sha1sum oredayo.crt
      9716fe4513c062014bef6c4742b7a2006a773780  oredayo.crt
      ```

      上記、 oredayo.key および oredayo.crt が追加されており、新規の証明書払い出しに成功したことがわかる。

1. お手持ちのブラウザへ、ルート証明書を登録する
   1. 表内の「ルート証明書ダウンロードボタン(自己署名証明書のみ)」を押下する。今回はファイルID:4に対して実施した。\
      <img src="./docs/03_04_download_rootca.png" width="640" alt="ダウンロードされたルート証明書">
   1. お手持ちのブラウザへ証明書を適用する。\
      Firefox の手順は以下の通り、 https://jp.globalsign.com/support/ssl/config/cert-import-firefox.html に従い実施。\
      <img src="./docs/03_05_apply_selfca_to_browser_1.png" width="640" alt="設定→プライバシーとセキュリティ・証明書を表示ボタン">\
      <img src="./docs/03_05_apply_selfca_to_browser_2.png" width="640" alt="証明書マネージャー（認証局証明書画面）・初期">\
      <img src="./docs/03_05_apply_selfca_to_browser_3.png" width="640" alt="インポートボタン押下、ダウンロードした証明書を選択">\
      <img src="./docs/03_05_apply_selfca_to_browser_4.png" width="640" alt="証明書のインポート確認画面・初期">\
      <img src="./docs/03_05_apply_selfca_to_browser_5.png" width="640" alt="証明書のインポート確認画面・内容選択">\
      <img src="./docs/03_05_apply_selfca_to_browser_6.png" width="640" alt="証明書マネージャー（認証局証明書画面）・インポート後">

#### 画面操作シナリオ２・証明書の更新指示

事前状態は以下の通り。

* nginx コンテナは前記の通り、ファイルID:4 とファイルID:9 の証明書を登録している。
* 証明書として、FQDN `localhost` に、新規の自己署名証明書（ファイルID:12）を登録した。\
  <img src="./docs/03_10_deployment_default.png" width="640" alt="証明書一覧読み出し直後の状態">

1. デプロイ指示を行う
   1. 表内の「デプロイ指示ボタン」を押下する。今回はファイルID:12に対して実施した。\
      <img src="./docs/03_11_deployment_command.png" width="640" alt="デプロイ指示時刻が更新された状態">
   1. 表上部の「新証明書適用（Webサーバ再起動）」ボタンを押下する。押下後、画面の更新はない。
   1. （確認）しばらく待つとWebサーバが再起動し、新しい証明書を読み込む。読み込まれた状態は以下の通り。

      ```bash
      $ docker exec -it webserver bash
      root:/# cd /etc/nginx/conf.d
      root:/etc/nginx/conf.d# ls -l
      total 28
      -rw-r--r-- 1 root root 117 Jan 27 08:13 certadmin_passwd.sec
      -rw-r--r-- 1 root root 810 Jan 27 08:13 localhost.crt
      -rw-r--r-- 1 root root 302 Jan 27 08:13 localhost.key
      -rw-r--r-- 1 root root 786 Jan 27 08:13 oredayo.crt
      -rw-r--r-- 1 root root 302 Jan 27 08:13 oredayo.key
      -rw-r--r-- 1 root root 906 Jan 27 03:33 sample.conf
      -rw-r--r-- 1 root root 233 Jan 27 08:13 webadmin_passwd.sec
      root:/etc/nginx/conf.d# sha1sum localhost.key 
      bdbb9c98ed3492e9820a28f52f2474c0dbe12ca8  localhost.key
      root:/etc/nginx/conf.d# sha1sum localhost.crt 
      98bae0475f35bc9bf596a273cc2d393a2ce5d72e  localhost.crt
      ```

      上記、 localhost.key および localhost.crt が事前状態と異なることから、更新されており、証明書の更新払い出しに成功したことがわかる。

## 注意事項 Caution to use (Only in Japanese language.)

本編集画面をそのまま使うにあたっては、以下の注意事項を念頭に置いて作業すること。

1. 本編集画面は、 nginx コンテナのサーバ設定との一致性を保証しない。FQDNを必ず設定し、nginxコンテナの設定と一致させること。
1. 本編集画面では、鍵・証明書の登録／生成内容がただちにデータベースへ反映されていく。確認画面は存在しない。

## API説明 How to use this web API without change (Only in Japanese language.)

APIの操作自体にBASIC認証が必要となる。実現している機能は [設計資料](./docs/Design.md) を参照。
