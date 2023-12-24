import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    user: 'postgres', // DB のユーザー名を指定
    host: 'dbserver',
    database: 'settings_nginx',
    password: 'mysecretpassword', // DB のパスワードを指定
    post: 5432
});
await client.connect();

const locations = await client.query('SELECT * FROM location;');
console.log(locations); //debug

const users = await client.query('SELECT * FROM userfile;');
console.log(users); //debug

await client.end();