// pg packages
const { Client } = require('pg');
const client_param = {
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};
// clild_process packages
const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('node:fs');

// express api functions
const generate_selfca_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`POST start.`);
        console.log(req.body);
        client.connect();

        // step 1: validate file_id
        if (typeof req.body.file_id !== 'string' && typeof req.body.file_id !== 'number'){
            const resmsg='req.body.file_id is not string or number.';
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 2-1: check file_id table in database
        const query_string1 = `SELECT * FROM certfiles WHERE file_id = ${req.body.file_id};`;
        const reply_object1 = await client.query(query_string1);
        if (reply_object1.rowCount !== 1) {
            const resmsg=`failed to get record from file_id=${req.body.file_id}.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const result1 = reply_object1.rows[0];
        if (result1.data_type !== 'root_selfca') {
            const resmsg=`failed to start ca generation. data_type=${result1.data_type} is not root_selfca.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const key_id = result1.key_id;
        if (key_id === null) {
            const resmsg=`failed to start ca generation. key_id not exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.root_id !== null) {
            const resmsg=`failed to start ca generation. root_id exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.cert_entity !== null) {
            const resmsg=`failed to start key generation. cert exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 2-2: check key_id table in database
        const query_string2 = `SELECT * FROM certfiles WHERE file_id = ${key_id};`;
        const reply_object2 = await client.query(query_string2);
        if (reply_object2.rowCount !== 1) {
            const resmsg=`failed to get parent record from file_id=${key_id}.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const result2 = reply_object2.rows[0];
        if (result2.data_type !== 'keypair') {
            const resmsg=`failed to start ca generation. data_type=${result1.data_type} is not parent keypair.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result2.key_id !== null) {
            const resmsg=`failed to start ca generation. parent has key_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result2.root_id !== null) {
            const resmsg=`failed to start ca generation. parent has root_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result2.prikey_entity === null) {
            const resmsg=`failed to start key generation. parent not have prikey_entity.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result2.pubkey_entity === null) {
            const resmsg=`failed to start key generation. parent not have pubkey_entity.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 3: create and regist root CA certificate
        // see. https://qiita.com/Vit-Symty/items/5be5326c9db9de755184
        const basename = (await execSync(`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1`)).toString().trim();
        await writeFileSync(`/tmp/${basename}.key`, result2.prikey_entity);
        await writeFileSync(`/tmp/${basename}.csr`, result2.pubkey_entity);
        const generate_rootca_command = `openssl x509 -req -sha256 -days 365 -in /tmp/${basename}.csr -signkey /tmp/${basename}.key -out /tmp/${basename}.crt`;
        await execSync(generate_rootca_command);
        const selfca=readFileSync(`/tmp/${basename}.crt`);

        const query_string3 = `UPDATE certfiles SET cert_entity = '${selfca}' WHERE file_id = '${req.body.file_id}';`;
        await client.query(query_string3);

        // step 4: remove private and public key from filesystem
        unlinkSync(`/tmp/${basename}.key`);
        unlinkSync(`/tmp/${basename}.csr`);
        unlinkSync(`/tmp/${basename}.crt`);

        res.status(200).send();
        console.log(`POST end.`);
    } catch (e) {
        res.status(500).send({error: `POST API failed.`});

        console.log(`POST API failed.`);
        console.log(e);
    } finally {
        client.end();
    }
};

// exports
module.exports = {
    generate_selfca_api,
};
