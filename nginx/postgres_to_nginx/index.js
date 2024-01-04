// packages
import * as fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

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

// main process
var main_process_completed = 1; // 0: true, >0: error in any process.
try {
    await client.connect();
    console.log(`connected to ${process.env.POSTGRES_DB}`);

    const query_string = 'SELECT * FROM userfile order by file asc;';
    console.log(query_string);
    const files = await client.query(query_string);
    console.table(files.rows);

    files.rows.forEach((file_obj) => {
        console.log(`write ${file_obj.username} info into ${file_obj.file}.`);
        const user = file_obj.username;
        const pass = execSync(`openssl passwd -6 ${file_obj.password}`).toString();
        const user_pass = `${user}:${pass}`; // pass contains \n
        fs.writeFile(`/etc/nginx/conf.d/${file_obj.file}.sec`, user_pass, {encoding: 'utf8', flag: 'a'});
    });

    main_process_completed = 0;
} catch (e) {
    console.log(e);
} finally {
    await client.end();
}
process.exit(main_process_completed);
