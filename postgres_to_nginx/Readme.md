# postgres_to_nginx

## 本プログラムの目的

1個上のディレクトリに記載の用途を満たすため、
postgreSQL に入っている location や user のデータを用いて、
nginx 向けの BASIC認証設定ファイルを出力する。

## ライセンス

WTFPL ライセンスで提供する。
本Readmeを含め、環境構築に関する参考資料として扱うことを望む。

## 前提

1個上のディレクトリの Readme.md を読んでください。

## 構築

```bash
docker build -t pgsql2nginx .
docker run --network localwebnw --volumes-from datavol --name pgsql2nginx pgsql2nginx
```

## 戻り値メモ

`SELECT * FROM location;` の結果は以下。

```json
Result {                                                                                                                                                                                           
  command: 'SELECT',
  rowCount: 2,
  oid: null,
  rows: [
    {
      location: 'webadmin',
      type: 'web admin',
      file: 'conf/webadmin_passwd'
    },
    {
      location: 'sysadmin',
      type: 'system admin',
      file: 'conf/sysadmin_passwd'
    }
  ],
  fields: [
    Field {
      name: 'location',
      tableID: 16389,
      columnID: 1,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 2052,
      format: 'text'
    },
    Field {
      name: 'type',
      tableID: 16389,
      columnID: 2,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 36,
      format: 'text'
    },
    Field {
      name: 'file',
      tableID: 16389,
      columnID: 3,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 36,
      format: 'text'
    }
  ],
  _parsers: [ [Function: noParse], [Function: noParse], [Function: noParse] ],
  _types: TypeOverrides {
    _types: {
      getTypeParser: [Function: getTypeParser],
      setTypeParser: [Function: setTypeParser],
      arrayParser: [Object],
      builtins: [Object]
    },
    text: {},
    binary: {}
  },
  RowCtor: null,
  rowAsArray: false,
  _prebuiltEmptyResultObject: { location: null, type: null, file: null }
}
```

`SELECT * FROM userfile;` の結果は以下。

```json
Result {
  command: 'SELECT',
  rowCount: 3,
  oid: null,
  rows: [
    {
      file: 'conf/webadmin_passwd',
      username: 'webadmin',
      password: 'webpass',
      comment: null
    },
    {
      file: 'conf/webadmin_passwd',
      username: 'sysadmin',
      password: 'syspass',
      comment: 'same as /sysadmin/ dir.'
    },
    {
      file: 'conf/sysadmin_passwd',
      username: 'sysadmin',
      password: 'syspass',
      comment: null
    }
  ],
  fields: [
    Field {
      name: 'file',
      tableID: 16394,
      columnID: 1,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 36,
      format: 'text'
    },
    Field {
      name: 'username',
      tableID: 16394,
      columnID: 2,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 132,
      format: 'text'
    },
    Field {
      name: 'password',
      tableID: 16394,
      columnID: 3,
      dataTypeID: 1043,
      dataTypeSize: -1,
      dataTypeModifier: 260,
      format: 'text'
    },
    Field {
      name: 'comment',
      tableID: 16394,
      columnID: 4,
      dataTypeID: 25,
      dataTypeSize: -1,
      dataTypeModifier: -1,
      format: 'text'
    }
  ],
  _parsers: [
    [Function: noParse],
    [Function: noParse],
    [Function: noParse],
    [Function: noParse]
  ],
  _types: TypeOverrides {
    _types: {
      getTypeParser: [Function: getTypeParser],
      setTypeParser: [Function: setTypeParser],
      arrayParser: [Object],
      builtins: [Object]
    },
    text: {},
    binary: {}
  },
  RowCtor: null,
  rowAsArray: false,
  _prebuiltEmptyResultObject: { file: null, username: null, password: null, comment: null }
}
```
