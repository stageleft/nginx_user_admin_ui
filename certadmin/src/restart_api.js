// packages
const { execSync } = require('node:child_process');

const restart_api = async function(req, res) {
    try {
        console.log(`POST /api/restart start.`);
        console.log(req.body);

        if (typeof req.body.container != 'string'){
            console.log('req.body.container is not string.');
            res.status(400).send({ message: 'API parameter is illegal.'} );
        } else {
            res.status(202).send();
            execSync(`curl -X POST --unix-socket /var/run/docker.sock http:///v1.43/containers/${req.body.container}/restart`);
        }

        console.log(`POST /api/restart finished.`);
    } catch (e) {
        res.status(400).send({ message: 'something failed.' });

        console.log(`POST /api/restart failed.`);
        console.log(e);
    }
};

module.exports = { restart_api };
