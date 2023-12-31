# postgres_to_nginx

## 本プログラムの目的

2個上のディレクトリに記載の用途を満たすため、
postgreSQL に入っている user のデータを用いて、
nginx 向けの BASIC認証設定ファイルを出力する。

## ライセンス

WTFPL ライセンスで提供する。
本Readmeを含め、環境構築に関する参考資料として扱うことを望む。

## 前提

2個上のディレクトリの Readme.md を読んでください。

## 戻り値メモ

`SELECT * FROM userfile;` の結果は以下。

```json
Result {
  command: 'SELECT',
  rowCount: 3,
  oid: null,
  rows: [
    {
      file: 'webadmin_passwd',
      username: 'webadmin',
      password: 'webpass',
      comment: null
    },
    {
      file: 'webadmin_passwd',
      username: 'sysadmin',
      password: 'syspass',
      comment: 'same as /sysadmin/ dir.'
    },
    {
      file: 'sysadmin_passwd',
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
