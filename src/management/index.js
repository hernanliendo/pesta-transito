"use strict";

const wait = require('wait-promise');

const admin = require("firebase-admin");
const serviceAccount = require("./pesta-transito-firebase-adminsdk-twwqq-ca6d8c9df5.json");
const _ = require('lodash');
const moment = require('moment');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pesta-transito.firebaseio.com"
});

const db = admin.database();

const change = old => {
    const v = ('' + old).trim();

    switch (v) {
        case '2':
            return '3do_A';

        case '2do_A':
            return '3ro_A';

        case '2do_B':
            return '3ro_B';

        case '2do_C':
            return '3ro_C';

        case '3':
        case '3ro_undefined':
        case '3ro_A':
            return '4to_A';

        case '3ro_B':
        case '3b':
            return '4to_B';

        case '3ro_C':
            return '4to_C';

        case '3ro_D':
            return '4to_D';

        case '1ro_A':
        case '1ro_D':
        case '1ro_G':
            return '2do_A';

        case '1ro_B':
        case '1b':
            return '2do_B';

        case '1ro_C':
            return '2do_C';


        case '4':
        case '4to_G':
        case '4to_A':
            return '5to_A';

        case '4to_B':
            return '5to_B';

        case '4to_C':
            return '5to_C';


        case '5A':
        case '5to_A':
        case '5to_G':
            return '6to_A';

        case '5to_B':
            return '6to_B';

        case '5to_C':
            return '6to_C';


        case '6to_A':
        case '6to_E':
            return '7mo_A';

        case '6to_B':
            return '7mo_B';

        case '6to_C':
            return '7mo_C';

        default:
            return v;
    }
};

const changeRemote = async (input) => {
    for (const p of _.toPairs(input)) {
        const vRef = db.ref(p[0]);
        console.log(p[0]);

        vRef.set(p[1]);

        await wait.sleep(5000);
    }
};

const getFamilies = () => db.ref('2018').once('value', snapshot => {
    const model = snapshot.val();
    let all = {};

    _.toPairs(model.families).forEach(familyPair => {
        const k = familyPair[0];

        _.toPairs(familyPair[1].ks).forEach(kidPair => {
            const grado = kidPair[1];
            all['2018/families/' + familyPair[0] + '/ks/' + kidPair[0]] = change(grado);
        });
    });
    changeRemote(all).then();
    console.log('done');
    // console.info(all);
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

getFamilies();
// getVoluntarios();
