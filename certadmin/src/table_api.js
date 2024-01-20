// pg packages
const { Client } = require('pg');
const client_param = {
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

// functions
const get_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`GET start.`);
        client.connect();

        const query_string = 'SELECT * FROM certfiles order by file_id asc;';
        const reply_object = await client.query(query_string);

        let response_object = [];
        for (let i in reply_object.rows) {
            let response_body = {};

            response_body.file_id = reply_object.rows[i].file_id;
            response_body.key_id = reply_object.rows[i].key_id;
            response_body.root_id = reply_object.rows[i].root_id;
            response_body.file_name = reply_object.rows[i].file_name;
            response_body.data_type = reply_object.rows[i].data_type;
            response_body.comment = reply_object.rows[i].comment;
            if (reply_object.rows[i].prikey_entity == null) {
                response_body.is_prikey_entity = false;
            } else {
                response_body.is_prikey_entity = true;
            }
            if (reply_object.rows[i].pubkey_entity == null) {
                response_body.is_pubkey_entity = false;
            } else {
                response_body.is_pubkey_entity = true;
            }
            if (reply_object.rows[i].cert_entity == null) {
                response_body.is_cert_entity = false;
            } else {
                response_body.is_cert_entity = true;
            }

            response_object.push(response_body);
        }

        // console.log(response_object);
        res.status(200).send(response_object);
        console.log(`GET completed.`);
    } catch (e) {
        res.status(500).send({error: 'failed.'});

        console.log('GET failed.');
        console.log(e);
    } finally {
        client.end();
    }
};

const post_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`POST start.`);
        console.log(req.body);
        client.connect();

        let key_id;
        if (typeof req.body.key_id === 'string' && req.body.key_id !== '') {
            key_id = `'${req.body.key_id}'`;
        } else {
            key_id = 'null';
        }
        let root_id;
        if (typeof req.body.root_id === 'string' && req.body.root_id !== '') {
            root_id = `'${req.body.root_id}'`;
        } else {
            root_id = 'null';
        }
        let file_name;
        if (typeof req.body.file_name === 'string') {
            file_name = `'${req.body.file_name}'`;
        } else {
            file_name = 'null';
        }
        let data_type;
        if (typeof req.body.data_type === 'string') {
            data_type = `'${req.body.data_type}'`;
            if (req.body.data_type === 'keypair') {
                key_id = 'null';
                root_id = 'null';
            } else if (req.body.data_type === 'root_selfca' || req.body.data_type === 'cacert') {
                root_id = 'null';
            } else if (req.body.data_type !== 'selfcert') {
                res.status(400).send({error: 'illegal data type.'});
                return; // exit try block
            }
        } else {
            res.status(400).send({error: 'illegal data type.'});
            return; // exit try block
        }
        let comment;
        if (typeof req.body.comment === 'string') {
            comment = `'${req.body.comment}'`;
        } else {
            comment = 'null';
        }

        const query_string = `INSERT INTO certfiles (key_id, root_id, file_name, data_type, comment) VALUES (${key_id}, ${root_id}, ${file_name}, ${data_type}, ${comment});`;
        await client.query(query_string);

        res.status(200).send();
        console.log(`POST completed.`);
    } catch (e) {
        res.status(500).send({error: 'failed.'});

        console.log('POST failed.');
        console.log(e);
    } finally {
        client.end();
    }
};
const put_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`PUT start.`);
        console.log(req.body);
        client.connect();

        // query param.
        let file_id;
        if (typeof req.body.file_id === 'number') {
            file_id = `'${req.body.file_id}'`;
        } else {
            res.status(400).send({error: 'illegal file_id.'});
            return; // exit try block
        }

        // update param.
        let key_id = null;
        if (typeof req.body.key_id === 'string') {
            if (req.body.key_id !== '') {
                key_id = `'${req.body.key_id}'`;
            } else {
                key_id = 'null'; // non_null to update key_id=null.
            }
        }
        let root_id = null;
        if (typeof req.body.root_id === 'string') {
            if(req.body.root_id !== '') {
                root_id = `'${req.body.root_id}'`;
            } else {
                root_id = 'null'; // non_null to update root_id=null.
            }
        }
        let data_type;
        if (typeof req.body.data_type === 'string') {
            data_type = `'${req.body.data_type}'`;
            if (req.body.data_type === 'keypair') {
                key_id = 'null';
                root_id = 'null';
            } else if (req.body.data_type === 'root_selfca' || req.body.data_type === 'cacert') {
                root_id = 'null';
            } else if (req.body.data_type !== 'selfcert') {
                res.status(400).send({error: 'illegal data type.'});
                return; // exit try block
            }
        } else {
            res.status(400).send({error: 'illegal data type.'});
            return; // exit try block
        }

        let update_executed = 0;
        if (typeof key_id === 'string') {
            const query_string = `UPDATE certfiles SET key_id = ${key_id} WHERE file_id = ${file_id};`;
            const reply_object = await client.query(query_string);
            update_executed = update_executed + reply_object.rowCount;
        }
        if (typeof root_id === 'string') {
            const query_string = `UPDATE certfiles SET root_id = ${root_id} WHERE file_id = ${file_id};`;
            const reply_object = await client.query(query_string);
            update_executed = update_executed + reply_object.rowCount;
        }
        if (typeof data_type === 'string') {
            const query_string = `UPDATE certfiles SET data_type = ${data_type} WHERE file_id = ${file_id};`;
            const reply_object = await client.query(query_string);
            update_executed = update_executed + reply_object.rowCount;
        }
        if (typeof req.body.file_name === 'string') {
            const query_string = `UPDATE certfiles SET file_name = '${req.body.file_name}' WHERE file_id = ${file_id};`;
            const reply_object = await client.query(query_string);
            update_executed = update_executed + reply_object.rowCount;
        }
        if (typeof req.body.comment === 'string') {
            const query_string = `UPDATE certfiles SET comment = '${req.body.comment}' WHERE file_id = ${file_id};`;
            const reply_object = await client.query(query_string);
            update_executed = update_executed + reply_object.rowCount;
        }

        if (update_executed == 0) {
            res.status(400).send('PUT API parameter is illegal.');
        } else {
            res.status(200).send();    
        }

        console.log(`PUT completed.`);
    } catch (e) {
        res.status(500).send({error: 'failed.'});

        console.log('PUT failed.');
        console.log(e);
    } finally {
        client.end();
    }
};
const delete_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`DELETE start.`);
        console.log(req.body);
        client.connect();

        if (typeof req.body.file_id != 'number'){
            console.log('req.body.file_id is not number.');
            res.status(400).send('DELETE API parameter is illegal.');
        } else {
            const query_string = `DELETE FROM certfiles WHERE file_id = '${req.body.file_id}';`;
            await client.query(query_string);
    
            res.status(200).send();
        }

        console.log(`DELETE completed.`);
    } catch (e) {
        res.status(500).send({error: 'failed.'});

        console.log('DELETE failed.');
        console.log(e);
    } finally {
        client.end();
    }
};

module.exports = {
    get_api,
    post_api,
    put_api,
    delete_api,
};
