"use strict";

const admin = require("firebase-admin");
const serviceAccount = require("./pesta-transito-firebase-adminsdk-twwqq-ca6d8c9df5.json");
const _ = require('lodash');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pesta-transito.firebaseio.com"
});

const db = admin.database();

const getFamilies = () => db.ref('2018').on('value', snapshot => {
    const model = snapshot.val();
    let r = '';

    _.toPairs(model.cars).forEach(p => {
        const family = model.families[p[1]];

        r += p[0] + ';' + family.n + ';';

        _.toPairs(family.ds).forEach(p => r += p[0] + ';' + p[1] + ';');

        r += '\n';
    });

    console.info(r);
});

const getVoluntarios = () => db.ref('2018').on('value', snapshot => {
    const model = snapshot.val();
    let r = '';

    _.toPairs(model.cars).forEach(p => {
        const family = model.families[p[1]];

        r += p[0] + ';' + family.n + ';';

        _.toPairs(family.ds).forEach(p => r += p[0] + ';' + p[1] + ';');

        r += '\n';
    });

    console.info(r);
});

// getFamilies();
getVoluntarios();
