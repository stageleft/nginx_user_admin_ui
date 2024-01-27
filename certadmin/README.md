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

### 画面説明（公開鍵証明書類）

* ホーム画面から、 `certfiles` メニューをクリックして、以下の証明書類管理画面に遷移する。 \
  <img src="./docs/02_01_certfiles.png" width="640" alt="証明書類管理画面">
* ボタン「ユーザ一覧読み出し」で、現在データベースに入っているデータを表に反映する。\
  <img src="./docs/02_02_certfiles_default.png" width="640" alt="初期・ユーザ一覧読み出し直後の状態">\
  上記画面の全体像は以下の通り。\
  <img src="./docs/02_03_certfiles_default_70percent.png" width="640" alt="初期・ユーザ一覧読み出し直後の状態">
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

### 画面説明（証明書利用要求）

* ホーム画面から、 `deploy` メニューをクリックして遷移した証明書類管理画面は以下の通り。 \
  <img src="./docs/03_01_deployment.png" width="640" alt="ログイン成功直後の状態">
* 以下、適宜操作を行い、グループ・ユーザー名・パスワードをお使いの状態に向けて変更していく。
  * 表の上のボタン操作方法は以下の通り。
    * ユーザ一覧読み出し： データベース上で管理している、正のデータを表に反映する。
    * 末尾に空行追加：表の一番下に、空っぽの行を追加する。データを新規追加するために用いる。
    * CSVダウンロード：現在、表示されているの表をCSVファイルとしてダウンロードする。データ破損時の手動復旧に不可欠であり、適宜実施すること。
    * フィルタ初期化：下記の表のフィルタ文字列を全て削除する。
    * 設定適用（Webサーバ再起動）：Webサーバを再起動し、現在のデータベース上にあるユーザー・パスワード設定をWebサーバに反映する。
    * webadminユーザ強制復旧（webadmin アプリサーバ再起動）：本コンテナを再起動し、現在のデータベースに以下の情報を追記する。 \
      グループ`webadmin_passwd`、ユーザー`webadmin`、パスワード`webpass`\
  * 表の読み方は以下のとおり。
    * グループ：ユーザ名とパスワードを適用するグループ名を指定する。グループ名は nginx コンテナの設定により決定する。詳細は [アプリ全体](../README.md) を参照。
      * サンプルでは `certadmin_passwd` と `webadmin_passwd` を準備している。
    * ユーザ名：BASIC認証のユーザ名を入力する。複数グループにまたがるユーザは各々設定すること。
    * パスワード：BASIC認証のパスワードを入力する。
    * 摘要：BASIC認証のコメント欄を入力してもよい。
    * 削除ボタン：当該の行のデータを、画面およびデータベースから削除する。
  * 表のデータは編集可能であり、基本的には編集と同時にデータベースに反映される。
    * ただし、グループ名・ユーザ名・パスワードが揃っていない場合はデータベースへの反映は失敗する。これらを揃えるように入力すること。
    * グループ名・ユーザ名の変更操作を行った場合は、変更後のグループ名・ユーザ名を新規追加する。\
      上記の仕様に伴い、変更操作前のグループ名・ユーザ名は画面に残らず、画面とデータベースが不一致となる。\
      変更操作後は上記「ユーザ一覧読み出し」ボタンをクリックして再一致化すること。

## 注意事項 Caution to use (Only in Japanese language.)

本編集画面をそのまま使うにあたっては、以下の注意事項を念頭に置いて作業すること。

1. 本編集画面は、 nginx コンテナのサーバ設定との一致性を保証しない。FQDNを必ず設定し、nginxコンテナの設定と一致させること。
1. 本編集画面では、鍵・証明書の登録／生成内容がただちにデータベースへ反映されていく。確認画面は存在しない。

## API説明 How to use this web API without change (Only in Japanese language.)

APIの操作自体にBASIC認証が必要となる。実現している機能は [設計資料](./docs/Design.md) を参照。
