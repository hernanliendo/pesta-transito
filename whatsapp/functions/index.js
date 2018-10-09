'use strict';

const rp = require('request-promise');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bigquery = require('@google-cloud/bigquery')();

admin.initializeApp();

const db = admin.database();
const botmakerToken = functions.config().botmaker.key;

const setCors = (req, res) => {
    res.set('Access-Control-Allow-Origin', req.headers['origin']);
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'token, content-type, accept-encoding');
    res.set('Access-Control-Max-Age', '2592000');
};

const checkAuth = req => {
    if (req.body.token !== 'JKL93uJFJ939VBN5451J4K8gkjhshj89n') throw new Error(`Invalid token [${req.body.token}]`);
};

exports.log_event = functions.https.onRequest((req, res) => {
    setCors(req, res);

    if (req.method === 'OPTIONS') return res.status(200).send('');

    checkAuth(req);

    bigquery
        .dataset('Audit')
        .table('logs')
        .insert([{
            type: req.body.t,
            ts: Math.trunc(new Date().getTime() / 1000),
            user_email: req.body.e,
            user_id: req.body.uid,
            params: JSON.stringify(req.body.params),
        }]);

    return res.status(200).send('ok');
});

exports.notify_parent = functions.https.onRequest((req, res) => {
    setCors(req, res);

    if (req.method === 'OPTIONS') return res.status(200).send('');

    checkAuth(req);

    return db.ref('requests/' + req.body.requestId).once('value')
        .then(snapshot => {
            const carRequest = snapshot.val();

            return Promise.all(['wsapp0', 'wsapp1', 'wsapp2']
                .map(k => carRequest.family[k])
                .filter(n => n)
                .map(n => rp({
                    method: 'POST',
                    uri: 'https://go.botmaker.com/api/v1.0/intent/v2',
                    headers: {'access-token': botmakerToken},
                    body: {
                        chatPlatform: 'whatsapp',
                        chatChannelNumber: '5491126225607',
                        platformContactId: n,
                        ruleNameOrId: 'alumno_listo_singular',
                        params: {driverName: 'conductor 1', students: 'estudiantes', dropLocation: 'Dársena Rápida'}
                    },
                    json: true
                })));
        }, error => {
            throw error;
        })
        .then(() => res.status(200).send('ok'));
});
