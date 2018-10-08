'use strict';

const rp = require('request-promise');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const bigquery = require('@google-cloud/bigquery')();

admin.initializeApp();

const db = admin.database();
const botmakerToken = functions.config().botmaker.key;

const corsHandler = (req, res) => {
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '2592000');

        return true;
    }
    return false;
};

const checkAuth = req => {
    if (req.body.token !== 'JKL93uJFJ939VBN5451J4K8gkjhshj89n') throw new Error(`Invalid token [${req.body.token}]`);
};

exports.log_event = functions.https.onRequest((req, res) => {
    checkAuth(req);

    if (corsHandler(req, res)) return res.status(204).send('');

    return bigquery
        .dataset('Audit')
        .table('logs')
        .insert([{
            type: req.body.t,
            ts: Math.trunc(new Date().getTime() / 1000),
            user_email: req.body.e,
            user_id: req.body.uid,
            params: JSON.stringify(req.body.params),
        }])
        .then(() => res.status(200).send('ok'));
});

exports.notify_parent = functions.https.onRequest((req, res) => {
    checkAuth(req);

    if (corsHandler(req, res)) return res.status(204).send('');

    return db.ref('2018/families/' + req.body.familyId).once('value')
        .then(snapshot => {
            const family = snapshot.val();

            return rp({
                method: 'POST',
                // uri: 'https://go.botmaker.com/api/v1.0/message/v3',
                uri: 'https://go.botmaker.com/api/v1.0/intent/v2',
                headers: {'access-token': botmakerToken},
                body: {
                    chatPlatform: 'whatsapp',
                    chatChannelNumber: '5491126225607',
                    platformContactId: '5491130467755',
                    // messageText: 'hola 1234',
                    ruleNameOrId: 'alumno_listo_singular',
                    params: {driverName: 'conductor 1', students: 'estudiantes', dropLocation: 'Dársena'}
                },
                json: true
            });
        }, error => {
            throw error;
        })
        .then(() => res.status(200).send('ok'));
});
