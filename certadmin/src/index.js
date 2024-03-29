// packages
const express = require('express');
const app = express();

// variables for Express. see https://expressjs.com/ja/4x/api.html#req
const port = 3000;
app.use(express.json())                         // for parsing application/json. 
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// frontend html
app.use('/', express.static(__dirname + '/public'));

// backend api
const { get_api, post_api, put_api, delete_api } = require('./table_api');
app.get('/api/', (req, res) => get_api(req, res));
app.post('/api/', (req, res) => post_api(req, res));
app.put('/api/', (req, res) => put_api(req, res));
app.delete('/api/', (req, res) => delete_api(req, res));

// backend file upload / download api
const { get_prikey_api, get_pubkey_api, get_cert_api, post_prikey_api, post_pubkey_api, post_cert_api } = require('./bytea_api');
app.get('/api/primarykey', (req, res) => get_prikey_api(req, res));
app.get('/api/publickey', (req, res) => get_pubkey_api(req, res));
app.get('/api/certfile', (req, res) => get_cert_api(req, res));
app.post('/api/primarykey', (req, res) => post_prikey_api(req, res));
app.post('/api/publickey', (req, res) => post_pubkey_api(req, res));
app.post('/api/certfile', (req, res) => post_cert_api(req, res));

// backend generate key/cert api
const { generate_keypair_api } = require('./generate_keypair_api');
app.post('/api/generate_keypair', (req, res) => generate_keypair_api(req, res));

const { generate_selfca_api } = require('./generate_selfca_api');
app.post('/api/generate_selfca', (req, res) => generate_selfca_api(req, res));

const { generate_selfcert_api } = require('./generate_selfcert_api');
app.post('/api/generate_selfcert', (req, res) => generate_selfcert_api(req, res));

// mark deploy api
const { get_deploy_history_api, post_deploy_command_api } = require('./deploy_api');
app.get('/api/deploy_history', (req, res) => get_deploy_history_api(req, res));
app.post('/api/deploy_history', (req, res) => post_deploy_command_api(req, res));

// container restart api
const { restart_api } = require('./restart_api');
app.post('/api/restart', (req, res) => restart_api(req, res));

// listen http port.
app.listen(port, () => {
  console.log(`webadmin server listening on port ${port}`)
});
