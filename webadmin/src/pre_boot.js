// packages
const pkg = require('pg');
const { Client } = pkg;

// variables for Postgres
console.log(`webadmin server pre check. connecting ${process.env.POSTGRES_SERVER}... `);
const client = new Client({
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});
client.connect(() => {
    console.log(`check webadmin user found or not...`);
    const query_string = `SELECT * FROM userfile WHERE file='webadmin_passwd' and username='webadmin';`;
    client.query(query_string, (err, res) => {
        if (err != null) {
            console.log(`webadmin server pre check failed. detail : ${e}.\nwebadmin server restarting...`);
            client.end();
            process.exit(1);
        } else if (res.rowCount < 1) {
            console.log(`webadmin user not found. restore default setting.`);
            const query_string_2 = `INSERT INTO userfile (file, username, password) VALUES ('webadmin_passwd', 'webadmin', 'webpass');`;
            client.query(query_string_2, (err, res) => {
                if (err != null) {
                    console.log(`webadmin user restore failed. detail : ${e}.\nwebadmin server restarting...`);
                    client.end();
                    process.exit(1);
                } else {
                    console.log(`webadmin user restored.`);
                    client.end();
                    process.exit(0);    
                }
            });    
        } else {
            console.log(`webadmin user found.`);
            client.end();
            process.exit(0);    
        }
    });
});
