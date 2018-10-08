'use strict';

const botmakerToken = functions.config().botmaker.key;
const rp = require('request-promise');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.database();

admin.initializeApp();

exports.notify_parent = functions.https.onRequest((req, res) => {
    const input = req.body;

    if (input.token !== 'JKL93uJFJ939VBN5451J4K8gkjhshj89n') return true;

    return db.ref('2018/families/' + input.familyId).on('value', snapshot => {
        const family = snapshot.val();

        console.warn('family', family);
        console.warn('botmakerToken', botmakerToken);

        return true;

//curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'access-token: your_token' -d '{"chatPlatform": "whatsapp", "chatChannelNumber": "your_phone_number", "platformContactId": "user_phone_number", "ruleNameOrId": "rule_name", "params": {"my_template_var":"var_value"}}' 'https://go.botmaker.com/api/v1.0/intent/v2'

        // rp({
        //     method: 'POST',
        //     uri: 'https://go.botmaker.com/api/v1.0/intent/v2',
        //     headers: {'access-token': botmakerToken},
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

    });
});
