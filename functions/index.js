'use strict';

const rp = require('request-promise');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.notify_parent = functions.https.onRequest((req, res) => {
    const r = JSON.parse(req.body);

    console.warn('r', r);

    return admin.database().ref('2018/families/' + r.familyId).on('value', snapshot => {
        const family = snapshot.val();

        console.warn('family', family);



        // rp({
        //     method: 'POST',
        //     uri: 'https://go.botmaker.com/api/v1.0/intent/v2',
        //     headers: {'access-token': functions.config().botmaker.key},
        //     body: {
        //         chatPlatform: 'whatsapp',
        //         chatChannelNumber: '5491126225607',
        //         platformContactId: '123321',
        //         ruleNameOrId: 'xxxxx',
        //     },
        //     json: true
        // })
        //     .then(function (parsedBody) {
        //         // POST succeeded...
        //     })
        //     .catch(function (err) {
        //         // POST failed...
        //     });
        // res.status(406).send('Not Acceptable');









    });
});
