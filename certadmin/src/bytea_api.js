// pg packages
const { Client } = require('pg');
const client_param = {
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

// express api functions
const get_prikey_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`GET start.`);
        console.log(req.query);
        client.connect();

        if (typeof req.query.file_id !== 'string' && typeof req.query.file_id !== 'number'){
            console.log('req.query.file_id is not string or number.');
            res.status(400).send('req.query.file_id is not string or number.');
        } else {
            const query_string = `SELECT file_name, prikey_entity FROM certfiles WHERE file_id = ${req.query.file_id};`;
            const reply_object = await client.query(query_string);
            if (reply_object.rowCount === 1) {
                console.log(reply_object.rows[0])
                res.status(200).send(reply_object.rows[0]);
            } else {
                res.status(400).send({"message": `failed to get file from file_id=${req.query.file_id}.`});
            }

        }
        console.log(`GET end.`);
    } catch (e) {
        res.status(500).send({error: `GET API failed.`});

        console.log(`GET API failed.`);
        console.log(e);
    } finally {
        client.end();
    }
};

const post_prikey_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`POST start.`);
        console.log(req.body);
        client.connect();

        if (typeof req.body.file_id !== 'string' && typeof req.body.file_id !== 'number'){
            console.log('req.body.file_id is not string or number.');
            res.status(400).send('req.body.file_id is not string or number.');
        } else {
            // decode Uint8Array -> Binary
            const entity1 = req.body.prikey_entity.toString();
            const entity2 = JSON.parse(`[${entity1}]`);
            const entity3 = new Uint8Array(entity2);
            const prikey_blob = new Blob([entity3]);
            const prikey_entity = Buffer.from(await prikey_blob.arrayBuffer());
            // query
            const query_string = `UPDATE certfiles SET prikey_entity = '${prikey_entity}' WHERE file_id = '${req.body.file_id}';`;
            await client.query(query_string);

            res.status(200).send();
        }
        console.log(`POST end.`);
    } catch (e) {
        res.status(500).send({error: `POST API failed.`});

        console.log(`POST API failed.`);
        console.log(e);
    } finally {
        client.end();
    }
};

const get_pubkey_api = async function (req, res)  {
    const client = new Client(client_param);
    try {
        console.log(`GET start.`);
        console.log(req.query);
        client.connect();

        if (typeof req.query.file_id !== 'string' && typeof req.query.file_id !== 'number'){
            console.log('req.query.file_id is not string or number.');
            res.status(400).send('req.query.file_id is not string or number.');
        } else {
            const query_string = `SELECT file_name, pubkey_entity FROM certfiles WHERE file_id = ${req.query.file_id};`;
            const reply_object = await client.query(query_string);
            if (reply_object.rowCount === 1) {
                console.log(reply_object.rows[0])
                res.status(200).send(reply_object.rows[0]);
            } else {
                res.status(400).send({"message": `failed to get file from file_id=${req.query.file_id}.`});
            }

        }
        console.log(`GET end.`);
    } catch (e) {
        res.status(500).send({error: `GET API failed.`});

        console.log(`GET API failed.`);
        console.log(e);
    } finally {
        client.end();
    }
};
const post_pubkey_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`POST start.`);
        console.log(req.body);
        client.connect();

        if (typeof req.body.file_id !== 'string' && typeof req.body.file_id !== 'number'){
            console.log('req.body.file_id is not string or number.');
            res.status(400).send('req.body.file_id is not string or number.');
        } else {
            // decode Uint8Array -> Binary
            const entity1 = req.body.pubkey_entity.toString();
            const entity2 = JSON.parse(`[${entity1}]`);
            const entity3 = new Uint8Array(entity2);
            const prikey_blob = new Blob([entity3]);
            const pubkey_entity = Buffer.from(await prikey_blob.arrayBuffer());
            // query
            const query_string = `UPDATE certfiles SET pubkey_entity = '${pubkey_entity}' WHERE file_id = '${req.body.file_id}';`;
            await client.query(query_string);

            res.status(200).send();
        }
        console.log(`POST end.`);
    } catch (e) {
        res.status(500).send({error: `POST API failed.`});

        console.log(`POST API failed.`);
        console.log(e);
    } finally {
        client.end();
    }
};

const get_cert_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`GET start.`);
        console.log(req.query);
        client.connect();

        if (typeof req.query.file_id !== 'string' && typeof req.query.file_id !== 'number'){
            console.log('req.query.file_id is not string or number.');
            res.status(400).send('req.query.file_id is not string or number.');
        } else {
            const query_string = `SELECT file_name, cert_entity FROM certfiles WHERE file_id = ${req.query.file_id};`;
            const reply_object = await client.query(query_string);
            if (reply_object.rowCount === 1) {
                console.log(reply_object.rows[0])
                res.status(200).send(reply_object.rows[0]);
            } else {
                res.status(400).send({"message": `failed to get file from file_id=${req.query.file_id}.`});
            }

        }
        console.log(`GET end.`);
    } catch (e) {
        res.status(500).send({error: `GET API failed.`});

        console.log(`GET API failed.`);
        console.log(e);
    } finally {
        client.end();
    }
};
const post_cert_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`POST start.`);
        console.log(req.body);
        client.connect();

        if (typeof req.body.file_id !== 'string' && typeof req.body.file_id !== 'number'){
            console.log('req.body.file_id is not string or number.');
            res.status(400).send('req.body.file_id is not string or number.');
        } else {
            // decode Uint8Array -> Binary
            const entity1 = req.body.cert_entity.toString();
            const entity2 = JSON.parse(`[${entity1}]`);
            const entity3 = new Uint8Array(entity2);
            const prikey_blob = new Blob([entity3]);
            const cert_entity = Buffer.from(await prikey_blob.arrayBuffer());
            // query
            const query_string = `UPDATE certfiles SET cert_entity = '${cert_entity}' WHERE file_id = '${req.body.file_id}';`;
            await client.query(query_string);

            res.status(200).send();
        }
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
    get_prikey_api,
    get_pubkey_api,
    get_cert_api,
    post_prikey_api,
    post_pubkey_api,
    post_cert_api,
};
