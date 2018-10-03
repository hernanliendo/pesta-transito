"use strict";

const admin = require("firebase-admin");
const serviceAccount = require("./pesta-transito-firebase-adminsdk-twwqq-ca6d8c9df5.json");
const _ = require('lodash');
const moment = require('moment');

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

const getVoluntarios = () => db.ref('events').on('value', snapshot => {
    const evtTypes = ['request', 'changeStatus', 'delivered'];
    let aggregation = {};

    _.toPairs(snapshot.val())
        .filter(p => _.find(evtTypes, t => t === p[1].t))
        .forEach(p => {
            const evt = p[1];
            const date = moment(evt.ets).format('DD-MM-YYYY');

            if (!aggregation[date])
                aggregation[date] = {};

            aggregation[date][evt.displayName] = 1;
        });

    _.toPairs(aggregation).forEach(p => console.warn(p[0] + ';' + Object.keys(p[1]).length + ';' + (_.toPairs(p[1]).map(pp => pp[0] + ';'))));
});

// getFamilies();
getVoluntarios();
