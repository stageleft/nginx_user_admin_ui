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
const get_deploy_history_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`GET start.`);
        client.connect();

        const query_string =
            `SELECT certfiles.file_id,root_id,file_name,data_type,deploy_date,comment FROM certfiles ` +
            `LEFT OUTER JOIN certfiles_deploy_history ON certfiles.file_id = certfiles_deploy_history.file_id ` +
            `WHERE certfiles.data_type = 'selfcert' OR certfiles.data_type = 'cacert' ` +
            `ORDER BY certfiles.file_id ASC;`;
        const reply_object = await client.query(query_string);

        res.status(200).send(reply_object.rows);
        console.log(`GET completed.`);
    } catch (e) {
        res.status(500).send({error: 'failed.'});

        console.log('GET failed.');
        console.log(e);
    } finally {
        client.end();
    }
};

const post_deploy_command_api = async function (req, res) {
    const client = new Client(client_param);
    try {
        console.log(`POST start.`);
        console.log(req.body);
        client.connect();

        // pre: validate file_id
        const file_id = req.body.file_id;
        if (typeof file_id !== 'string' && typeof file_id !== 'number'){
            const resmsg='req.body.file_id is not string or number.';
            res.status(400).send({"message": resmsg});
            console.log(resmsg);
            return;
        }

        // 1st: check history exists.
        const query_string1 = `SELECT * FROM certfiles_deploy_history WHERE file_id = '${file_id}';`;
        const reply_object1 = await client.query(query_string1);
        let query_string2;
        if (reply_object1.rowCount === 1){
            // 2nd-1: update(rewrite) current history
            query_string2 = `UPDATE certfiles_deploy_history SET deploy_date = CURRENT_TIMESTAMP(0) WHERE file_id = '${file_id}';`;
        } else {
            // 2nd-1: insert(create) new history
            query_string2 = `INSERT INTO certfiles_deploy_history (file_id, deploy_date) VALUES (${file_id}, CURRENT_TIMESTAMP(0));`;
        }
        await client.query(query_string2);

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

module.exports = {
    get_deploy_history_api,
    post_deploy_command_api,
};
