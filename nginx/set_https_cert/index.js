// pg packages
import pkg from 'pg';
const { Client } = pkg;
const client_param = {
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

// node packages
import { writeFileSync } from 'node:fs';

const get_fqdn_list = async function() {
    const client = new Client(client_param);
    try {
        client.connect();
        const query_string = `SELECT file_name FROM certfiles group by file_name;`;
        const reply_object = await client.query(query_string);
    
        return (reply_object.rows);
    } catch (e) {
        console.error(e);

        return [];
    } finally {
        client.end();
    }
}

const get_cert_file_ids = async function(fqdn) {
    const client = new Client(client_param);
    try {
        client.connect();
        const query_string =
            `SELECT certfiles.file_id,key_id,deploy_date FROM certfiles ` +
            `LEFT OUTER JOIN certfiles_deploy_history ON certfiles.file_id = certfiles_deploy_history.file_id ` +
            `WHERE file_name = '${fqdn}' ` +
            `AND deploy_date IS NOT NULL ` +
            `ORDER BY deploy_date DESC `+
            `LIMIT 1;`;
        const reply_object = await client.query(query_string);

        return (reply_object.rows)
    } catch (e) {
        console.error(e);

        return [];
    } finally {
        client.end();
    }
}

const read_cert_entity = async function(file_id) {
    const client = new Client(client_param);
    try {
        client.connect();
        const query_string = `SELECT cert_entity FROM certfiles WHERE file_id = '${file_id}';`
        const reply_object = await client.query(query_string);

        return (reply_object.rows[0].cert_entity);
    } catch (e) {
        console.error(e);

        return null;
    } finally {
        client.end();
    }
}

const read_prikey_entity = async function(file_id) {
    const client = new Client(client_param);
    try {
        client.connect();
        const query_string = `SELECT prikey_entity FROM certfiles WHERE file_id = '${file_id}';`
        const reply_object = await client.query(query_string);

        return (reply_object.rows[0].prikey_entity);
    } catch (e) {
        console.error(e);

        return null;
    } finally {
        client.end();
    }
}

// main process
const main = async function() {
    let fqdn_list = await get_fqdn_list();
    for (let i in fqdn_list) {
        let file_name = fqdn_list[i].file_name;
        let id_cert_key_pair = await get_cert_file_ids(file_name);
        for (let j in id_cert_key_pair) {
            const cert_entity = await read_cert_entity(id_cert_key_pair[j].file_id);
            await writeFileSync(`/etc/nginx/conf.d/${file_name}.crt`, cert_entity);

            const key_entity = await read_prikey_entity(id_cert_key_pair[j].key_id);
            await writeFileSync(`/etc/nginx/conf.d/${file_name}.key`, key_entity);
        }
    }
}

try{
    await main();
    process.exit(0);
} catch(err) {
    console.error(err);
    process.exit(1);
}
