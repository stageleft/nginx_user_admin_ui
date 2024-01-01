// packages
const express = require('express');
const app = express();
const pkg = require('pg');
const { Client } = pkg;

// variables
const port = 3000;
const client = new Client({
    host: process.env.POSTGRES_SERVER,
    post: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});
client.connect();

// frontend html
app.use('/', express.static(__dirname + '/public'));

// backend api
app.get('/api/', async (req, res) => {
    try {
        const query_string = 'SELECT * FROM userfile order by file asc;';
        const files = await client.query(query_string);

        res.status(200).send(files.rows);
    } catch (e) {
        console.log(e);
        res.status(500).send({error: `API failed. detail : ${e}`});
        process.exit(1); // force restart by docker
    }
});

app.post('/api/', (req, res) => {
    res.status(404).send('Post is not exists.')
});
  
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});