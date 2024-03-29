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
const { readFileSync, unlinkSync } = require('node:fs');

// express api functions
const generate_keypair_api = async function (req, res) {
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

        // step 2: check database
        const query_string1 = `SELECT * FROM certfiles WHERE file_id = ${req.body.file_id};`;
        const reply_object1 = await client.query(query_string1);
        if (reply_object1.rowCount !== 1) {
            const resmsg=`failed to get record from file_id=${req.body.file_id}.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const result1 = reply_object1.rows[0];
        if (result1.data_type !== 'keypair') {
            const resmsg=`failed to start key generation. data_type=${result1.data_type} is not keypair.`
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.key_id !== null) {
            const resmsg=`failed to start key generation. key_id exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.root_id !== null) {
            const resmsg=`failed to start key generation. root_id exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        const common_name = result1.file_name;
        if (typeof common_name !== 'string' || common_name.length < 1) {
            const resmsg=`failed to start key generation. file_name is illegal.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.prikey_entity !== null) {
            const resmsg=`failed to start key generation. private key exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }
        if (result1.pubkey_entity !== null) {
            const resmsg=`failed to start key generation. public key exists.`;
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // step 3: create and regist private and public key
        // see. https://qiita.com/Vit-Symty/items/5be5326c9db9de755184
        const basename = (await execSync(`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1`)).toString().trim(); 
        const generate_prikey_command = `openssl ecparam -out /tmp/${basename}.key -name prime256v1 -genkey`;
        await execSync(generate_prikey_command);
        const generate_pubkey_command = `openssl req -new -sha256 -key /tmp/${basename}.key -out /tmp/${basename}.csr`;
        const country_code=process.env.CSRINFO_COUNTRY || 'JP';
        const state=process.env.CSRINFO_STATE || 'Tokyo';
        const city=process.env.CSRINFO_CITY || '';
        const company=process.env.CSRINFO_ORG || '';
        const section=process.env.CSRINFO_DIV || '';
        const email=process.env.CSRINFO_MAIL || '';
        const challenge=process.env.CSRINFO_CHALLENGE || '';
        const company_opt=process.env.CSRINFO_OPT_ORG || '';
        const generate_pubkey_stdin = `${country_code}\n${state}\n${city}\n${company}\n${section}\n${common_name}\n${email}\n${challenge}\n${company_opt}\n`;
        await execSync(generate_pubkey_command, {input: generate_pubkey_stdin});
        const prikey=readFileSync(`/tmp/${basename}.key`);
        const pubkey=readFileSync(`/tmp/${basename}.csr`);

        const comment =`CSR: C = ${country_code}, ST = ${state}, L = ${city}, O = ${company}, OU = ${section}, CN = ${common_name}, emailAddress = ${email}`;
        const query_string2 = `UPDATE certfiles SET prikey_entity = '${prikey}', pubkey_entity = '${pubkey}', comment='${comment}' WHERE file_id = '${req.body.file_id}';`;
        await client.query(query_string2);

        // step 4: remove private and public key from filesystem
        unlinkSync(`/tmp/${basename}.key`);
        unlinkSync(`/tmp/${basename}.csr`);

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
    generate_keypair_api,
};
