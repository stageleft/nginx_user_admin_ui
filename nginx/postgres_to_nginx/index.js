import * as fs from 'node:fs/promises';

import pkg from 'pg';
const { Client } = pkg;

// variables
const client = new Client({
    host: process.env.POSTGRES_SERVER,
    post: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});

// methods
const user_conf = async (filename, rows) => {
    // rows : Array of Object. Object contains 2 keys.
    //        username: string
    //        password: string
    const output_text = "";
    rows.forEach((row) => function(){
        output_text = output_text + `${row.username}:${row.password}\n`;
    });
    fs.writeFileSync(`/etc/nginx/conf.d/${filename}.sec`, output_text);
};

// main process
try {
    await client.connect();
    console.log(`connected to ${process.env.POSTGRES_DB}`);

    const query_string = 'SELECT file FROM userfile GROUP by file;';
    console.log(query_string);
    const files = await client.query(query_string);
    console.table(files.rows);

    files.rows.forEach(async (filename) => {
        const query_string = `SELECT username,password FROM userfile where file = '${filename}';`;
        console.log(query_string);
        const users = await client.query(query_string);
        console.table(users.rows);
        user_conf(filename, users.rows);
    });    
} catch (e) {
    console.log(e);
} finally {
    await client.end();
}
