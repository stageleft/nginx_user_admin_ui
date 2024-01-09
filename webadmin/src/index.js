// packages
const express = require('express');
const app = express();
const pkg = require('pg');
const { Client } = pkg;
const { execSync } = require('node:child_process');

// variables for Express. see https://expressjs.com/ja/4x/api.html#req
const port = 3000;
app.use(express.json())                         // for parsing application/json. 
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// variables for Postgres
console.log(`webadmin server start up. connecting ${process.env.POSTGRES_SERVER}... `);
const client = new Client({
    host: process.env.POSTGRES_SERVER,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});
client.connect();

// functions
const get_api = async function (req, res) {
    try {
        console.log(`GET start.`);

        const query_string = 'SELECT * FROM userfile order by file asc;';
        const reply_object = await client.query(query_string);

        res.status(200).send(reply_object.rows);
        console.log(`GET end.`);
    } catch (e) {
        console.log(e);
        res.status(500).send({error: `GET API failed. detail : ${e}`});

        console.log(`API failed. detail : ${e}.\nwebadmin server restarting...`);
        process.exit(1); // force restart by docker
    }
};
const post_api = async function (req, res) {
    try {
        console.log(`POST start.`);
        console.log(req.body);

        if (typeof req.body.file != 'string'){
            console.log('req.body.file is not string.');
            res.status(400).send('POST API parameter is illegal.');
        } else if (typeof req.body.username != 'string'){
            console.log('req.body.username is not string.');
            res.status(400).send('POST API parameter is illegal.');
        } else if (typeof req.body.password != 'string'){
            console.log('req.body.password is not string.');
            res.status(400).send('POST API parameter is illegal.');
        } else {
            let query_string;
            if (typeof req.body.comment == 'string'){
                query_string = `INSERT INTO userfile (file, username, password, comment) VALUES ('${req.body.file}', '${req.body.username}', '${req.body.password}', '${req.body.comment}');`;
            } else {
                query_string = `INSERT INTO userfile (file, username, password) VALUES ('${req.body.file}', '${req.body.username}', '${req.body.password}');`;
            }
            const reply_object = await client.query(query_string);

            console.log(reply_object.rowCount);
            res.status(200).send(reply_object.rowCount.toString()); // return '0' (fail) or '1' (success)
        }

        console.log(`POST end.`);
    } catch (e) {
        console.log(e);
        res.status(500).send({error: `POST API failed. detail : ${e}`});

        console.log(`POST API failed. detail : ${e}.\nwebadmin server restarting...`);
        process.exit(1); // force restart by docker
    }
};
const put_api = async function (req, res) {
    try {
        console.log(`PUT start.`);
        console.log(req.body);

        let update_executed = 0;
        if (typeof req.body.file != 'string'){
            console.log('req.body.file is not string.');
        } else if (typeof req.body.username != 'string'){
            console.log('req.body.username is not string.');
        } else {
            if (typeof req.body.password == 'string'){
                const query_string = `UPDATE userfile SET password = '${req.body.password}' WHERE file = '${req.body.file}' AND username = '${req.body.username}';`;
                console.log(`query_string=${query_string}`);
                const reply_object = await client.query(query_string);
                console.log(reply_object.rowCount);
                console.log(reply_object.rows);
                update_executed = update_executed + reply_object.rowCount;
            }
    
            if (typeof req.body.comment == 'string'){
                const query_string = `UPDATE userfile SET comment = '${req.body.comment}' WHERE file = '${req.body.file}' AND username = '${req.body.username}';`;
                console.log(`query_string=${query_string}`);
                const reply_object = await client.query(query_string);
                console.log(reply_object.rowCount);
                console.log(reply_object.rows);
                update_executed = update_executed + reply_object.rowCount;
            }
        }
        if (update_executed == 0) {
            res.status(400).send('PUT API parameter is illegal.');
        } else {
            const query_string = `SELECT * FROM userfile WHERE file = '${req.body.file}' AND username = '${req.body.username}';`;
            const reply_object = await client.query(query_string);
    
            res.status(200).send(reply_object.rows);    
        }

        console.log(`PUT end.`);
    } catch (e) {
        console.log(e);
        res.status(500).send({error: `PUT API failed. detail : ${e}`});

        console.log(`PUT API failed. detail : ${e}.\nwebadmin server restarting...`);
        process.exit(1); // force restart by docker
    }
};
const delete_api = async function (req, res) {
    try {
        console.log(`DELETE start.`);
        console.log(req.body);

        if (typeof req.body.file != 'string'){
            console.log('req.body.file is not string.');
            res.status(400).send('DELETE API parameter is illegal.');
        } else if (typeof req.body.username != 'string'){
            console.log('req.body.username is not string.');
            res.status(400).send('DELETE API parameter is illegal.');
        } else {
            const query_string = `DELETE FROM userfile WHERE file = '${req.body.file}' AND username = '${req.body.username}';`;
            const reply_object = await client.query(query_string);
    
            console.log(reply_object.rowCount);
            res.status(200).send(reply_object.rowCount.toString()); // return '0' (fail) or '1' (success)  
        }

        console.log(`DELETE end.`);
    } catch (e) {
        console.log(e);
        res.status(500).send({error: `DELETE API failed. detail : ${e}`});

        console.log(`DELETE API failed. detail : ${e}.\nwebadmin server restarting...`);
        process.exit(1); // force restart by docker
    }
};

// frontend html
app.use('/', express.static(__dirname + '/public'));

// backend api
app.get('/api/', (req, res) => get_api(req, res));
app.post('/api/', (req, res) => post_api(req, res));
app.put('/api/', (req, res) => put_api(req, res));
app.delete('/api/', (req, res) => delete_api(req, res));

// container restart api
app.post('/api/restart', async (req, res) => {
    try {
        console.log(`/api/restart start.`);
        console.log(req.body);

        if (typeof req.body.container != 'string'){
            console.log('req.body.container is not string.');
            res.status(400).send('API parameter is illegal.');
        } else {
            res.status(202).send(`restart ${req.body.container } accepted.`);
            execSync(`curl -X POST --unix-socket /var/run/docker.sock http:///v1.43/containers/${req.body.container}/restart`);
        }

        console.log(`/api/restart end.`);
    } catch (e) {
        console.log(e);
        res.status(400).send({error: `API failed. detail : ${e}`});

        console.log(`API failed. detail : ${e}.\n`);
    }
});

app.listen(port, () => {
  console.log(`webadmin server listening on port ${port}`)
});