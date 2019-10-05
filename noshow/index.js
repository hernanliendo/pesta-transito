'use strict';

const rp = require('request-promise');
const _ = require('lodash');
const csv = require("fast-csv");

const fixPhone = p => p.startsWith('549') ? p : '549' + p;

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const MODEL = {};

const add = data => {
    DAYS.forEach(dayName => {
        const name = _.get(data, `${dayName} Nombre`, '').trim();
        const level = _.get(data, `${dayName} Nivel`, '').trim().toLowerCase();
        const email = _.get(data, `${dayName} Email`, '').trim().toLowerCase();
        const wapp = fixPhone(_.get(data, `${dayName} WhatsApp`, '').trim().replace(/\D/g, ''));

        if (email.length > 0 && wapp.length > 0)
            MODEL[dayName] = (MODEL[dayName] || []).concat({name, level, email, wapp});
    });
};

try {
    rp({uri: `https://docs.google.com/spreadsheets/d/1zi8fBYaPN24Dbj9NfqbgfrKgwaICJo5vD_7Y1JArI-k/gviz/tq?tqx=out:csv&sheet=Tarde`})
        .then(data => csv.fromString(data, {headers: true})
            .on("data", add)
            .on("end", () => {
                const today = MODEL[DAYS[0]];
                // const today = MODEL[DAYS[new Date().getDay() - 1]];
                console.log('today', today);

                // var today = new Date();
                // if(today.getDay() == 6 || today.getDay() == 0) alert('Weekend!');

                /*
                 { name: 'De Bellis, Karina',
    level: 'primaria',
    email: 'karinadebellis@yahoo.com.ar',
    wapp: '5491149730189' },
                 */

                // console.error('expedia', 'sending1: ' + msgs.length);
                // console.error('expedia', 'sending2: ' + JSON.stringify(msgs[0]));
                //
                // Promise.all(_.chunk(msgs, 400).map(items => rp({
                //     uri: 'https://go.botmaker.com/api/v1.0/intent/v2Multiple',
                //     method: 'POST',
                //     json: true,
                //     headers: {'access-token': TOK23EN},
                //     body: {items}
                // })))
                //     .then(() => res.status(200).send(`Notifications triggered: ${msgs.length}`))
                //     .catch(() => {
                //         console.log('expedia', err.stack);
                //         res.status(200).send('' + err.stack);
                //     });
            }))
        .catch(err => {
            console.log('pesta', err.stack);
            res.status(200).send('' + err.stack);
        });
} catch (err) {
    console.error('pesta', err.stack);
    res.status(500).json({error: err.stack});
}
