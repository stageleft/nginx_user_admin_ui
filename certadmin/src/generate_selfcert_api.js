// pg packages
const { Client } = require('pg');
const client_param = {
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};
const { DateTime } = require('luxon');
// clild_process packages
const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('node:fs');

// express api functions
const generate_selfcert_api = async function (req, res) {
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
        if (result1.data_type !== 'selfcert') {
            const resmsg=`failed to start self-cert generation. data_type=${result1.data_type} is not selfcert.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const key_id = result1.key_id;
        if (key_id === null) {
            const resmsg=`failed to start self-cert generation. key_id not exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const root_id = result1.root_id;
        if (root_id === null) {
            const resmsg=`failed to start self-cert generation. root_id not exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.cert_entity !== null) {
            const resmsg=`failed to start self-cert generation. cert exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 2-2: check key_id table in database
        const query_string2 = `SELECT * FROM certfiles WHERE file_id = ${key_id};`;
        const reply_object2 = await client.query(query_string2);
        if (reply_object2.rowCount !== 1) {
            const resmsg=`failed to get parent key record from file_id=${key_id}.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const result2 = reply_object2.rows[0];
        if (result2.data_type !== 'keypair') {
            const resmsg=`failed to start self-cert generation. data_type=${result2.data_type} is not parent keypair.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if ( result2.key_id !== null) {
            const resmsg=`failed to start self-cert generation. parent key has key_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result2.root_id !== null) {
            const resmsg=`failed to start self-cert generation. parent key has root_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result2.pubkey_entity === null) {
            const resmsg=`failed to start self-cert generation. parent key not have pubkey_entity.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const common_name = result2.file_name;
        if (common_name === null) {
            const resmsg=`failed to start self-cert generation. common name of parent key is uncertain.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 2-3: check root_id table in database
        const query_string3 = `SELECT * FROM certfiles WHERE file_id = ${root_id};`;
        const reply_object3 = await client.query(query_string3);
        if (reply_object3.rowCount !== 1) {
            const resmsg=`failed to get parent ca record from file_id=${root_id}.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const result3 = reply_object3.rows[0];
        if (result3.data_type !== 'root_selfca') {
            const resmsg=`failed to start self-cert generation. data_type=${result3.data_type} is not parent root_selfca.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const root_key_id = result3.key_id;
        if (root_key_id === null) {
            const resmsg=`failed to start self-cert generation. parent ca not have key_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result3.root_id !== null) {
            const resmsg=`failed to start self-cert generation. parent ca has root_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result3.cert_entity === null) {
            const resmsg=`failed to start self-cert generation. parent ca not have cert_entity.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 2-4: check root_id -> key_id table in database
        const query_string4 = `SELECT * FROM certfiles WHERE file_id = ${root_key_id};`;
        const reply_object4 = await client.query(query_string4);
        if (reply_object4.rowCount !== 1) {
            const resmsg=`failed to get parent key record from file_id=${root_key_id}.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const result4 = reply_object4.rows[0];
        if (result4.data_type !== 'keypair') {
            const resmsg=`failed to start self-cert generation. data_type=${result4.data_type} is not grand parent keypair.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result4.key_id !== null) {
            const resmsg=`failed to start self-cert generation. grand parent key has key_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result4.root_id !== null) {
            const resmsg=`failed to start self-cert generation. grand parent key has root_id.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result4.prikey_entity === null) {
            const resmsg=`failed to start self-cert generation. grand parent key not have prikey_entity.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const common_name_selfca = result2.file_name;
        if (common_name_selfca === null) {
            const resmsg=`failed to start self-cert generation. common name of self root ca is uncertain.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (common_name === common_name_selfca) {
            const resmsg=`failed to start self-cert generation. common name of parent key needs different from common name of self root ca.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 3: create and regist self-signed certificate
        // see. https://qiita.com/Vit-Symty/items/5be5326c9db9de755184
        const basename_in = (await execSync(`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1`)).toString().trim();
        await writeFileSync(`/tmp/${basename_in}.csr`, result2.pubkey_entity); // 2-2 public key
        await writeFileSync(`/tmp/${basename_in}.crt`, result3.cert_entity);   // 2-3 root ca cert
        await writeFileSync(`/tmp/${basename_in}.key`, result4.prikey_entity); // 2-4 private key
        let basename_out;
        do {
            basename_out = (await execSync(`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1`)).toString().trim();
        } while(basename_out === basename_in);
        const selfcert_expire_days = process.env.SELFCERT_DAYS || 400; // default: 1year(366) + 1month(31) + some buffer(3)
        const generate_selfcert_command = `openssl x509 -req -in /tmp/${basename_in}.csr -CA /tmp/${basename_in}.crt -CAkey /tmp/${basename_in}.key -CAcreateserial -out /tmp/${basename_out}.crt -days ${selfcert_expire_days} -sha256`
        await execSync(generate_selfcert_command);
        const selfcert=readFileSync(`/tmp/${basename_out}.crt`);

        let expire_date = DateTime.now().plus({ days: selfcert_expire_days });
        const comment = `expires ${expire_date.toISODate()}`;
        const query_stringR = `UPDATE certfiles SET cert_entity = '${selfcert}', comment='${comment}' WHERE file_id = '${req.body.file_id}';`;
        await client.query(query_stringR);

        // step 4-1: remove used files from filesystem
        unlinkSync(`/tmp/${basename_in}.key`);
        unlinkSync(`/tmp/${basename_in}.csr`);
        unlinkSync(`/tmp/${basename_in}.crt`);

        // step 4-2: remove generated files from filesystem
        unlinkSync(`/tmp/${basename_in}.srl`);
        unlinkSync(`/tmp/${basename_out}.crt`);

        // step 5: return 200 to finish.
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
    generate_selfcert_api,
};
