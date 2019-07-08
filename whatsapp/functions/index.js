'use strict';

const _ = require('lodash');
const rp = require('request-promise');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery({projectId: 'pesta-transito'});

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

exports.daily_reset_pending_requests = functions.https.onRequest((req, res) => {
    return db.ref('requests').once('value')
        .then(snapshot => {
            const requests = snapshot.val();

            return !requests ?
                new Promise(() => {
                }) :
                Promise.all(_.toPairs(requests)
                    .map(reqPair => db.ref('requests/' + reqPair[0]).remove()));

        }, error => {
            throw error;
        })
        .then(() => res.status(200).send('ok'));
});

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
            const dropLocation = _.get(req, 'body.request.jardin', false) ? 'Dársena de Jardín' : 'Dársena Rápida';

            const driverName = _.join(
                _.toPairs(
                    _.get(carRequest, 'family.ds', {}))
                    .map(p => p[0]),
                '/'
            );

            const studentsArray = _.toPairs(
                _.get(carRequest, 'family.ks', {})
            )
                .filter((p, pidx) => !carRequest.unrequested || !carRequest.unrequested[pidx])
                .map(p =>
                    _.join(_.split(p[0].toLowerCase(), ' ').map(t => _.capitalize(t)), ' ')
                );

            const students = _.join(studentsArray, '/');
            const plural = _.has(carRequest, 'notes') || studentsArray.length > 1;

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
                        clientPayload: req.body.requestId,
                        platformContactId: n,
                        ruleNameOrId: plural ? 'alumno_listo_plural' : 'alumno_listo_singular',
                        params: {driverName, students, dropLocation, requestId: req.body.requestId}
                    },
                    json: true
                })));
        }, error => {
            throw error;
        })
        .then(() => res.status(200).send('ok'));
});

exports.wapp_status_notification = functions.https.onRequest((req, res) => {
    setCors(req, res);

    if (req.method === 'OPTIONS') return res.status(200).send('');

    const requestId = _.get(req, 'body.CLIENT_PAYLOAD', '');
    const status = _.get(req, 'body.STATUS', '');

    if (status === 'read' || status === 'delivered') {
        return db
            .ref('requests/' + requestId + '/statuses')
            .push()
            .set({state: 'wappStatus', status, uid: 'system'})
            .then(() => res.status(200).send(''))
            .catch(err => {
                console.error(err, err.stack);
                throw err;
            });
    } else {
        return new Promise(() => res.status(200).send(''));
    }
});

exports.parent_replied = functions.https.onRequest((req, res) => {
    setCors(req, res);

    if (req.method === 'OPTIONS') return res.status(200).send('');

    checkAuth(req);

    return db
        .ref('requests/' + req.body.requestId + '/statuses')
        .push()
        .set({state: 'parentReplied', resp: req.body.resp, uid: 'system'})
        .then(() => res.status(200).send('ok'));
});
