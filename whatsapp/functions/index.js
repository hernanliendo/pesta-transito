'use strict';

const rp = require('request-promise');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.database();
const botmakerToken = functions.config().botmaker.key;

exports.notify_parent = functions.https.onRequest((req, res) => {
    if (req.body.token !== 'JKL93uJFJ939VBN5451J4K8gkjhshj89n') throw new Error(`Invalid token [${req.body.token}]`);

    return db.ref('2018/families/' + req.body.familyId).once('value')
        .then(snapshot => {
            const family = snapshot.val();

            return rp({
                method: 'POST',
                uri: 'https://go.botmaker.com/api/v1.0/message/v3',
                // uri: 'https://go.botmaker.com/api/v1.0/intent/v2',
                headers: {'access-token': botmakerToken},
                body: {
                    chatPlatform: 'whatsapp',
                    chatChannelNumber: '5491126225607',
                    platformContactId: '5491130467755',
                    messageText: 'hola 1234',
                    //ruleNameOrId: 'xxxxx',
                },
                json: true
            });
        }, error => {
            throw error;
        })
        .then(() => res.status(200).send('ok'));
});
