import React from "react";
import PropTypes from "prop-types";
import './App.css';
import {Button} from "react-md";
import zipcelx from "zipcelx";

const createReactClass = require('create-react-class');
const _ = require('lodash');
const moment = require('moment');

const AdminData = createReactClass({

    onDelete(i) {
        const carsToDelete = _.toPairs(this.props.model.cars).filter(p => p[1] === i.familyId).map(p => p[0]);
        if (carsToDelete.length > 0) {
            this.props.db.ref('2018/families/' + i.familyId).set(null);
            this.props.db.ref('2018/cars/' + carsToDelete[0]).set(null);
        }
    },

    onEdit(i) {
        this.props.onEditFamily(i);
    },

    formatDate(date) {
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    },

    onDownloadRequests() {
        const toC = v => ({value: v || '', type: 'string'});

        this.props.db.ref('events').once('value').then(snapshot => {
            const data =
                [[toC('Fecha'), toC('Tipo'), toC('Email'), toC('Nombre'), toC('Estado'), toC('Familia'), toC('Patente')]]
                    .concat(_.toPairs(snapshot.val()).map(p => {

                        return [
                            toC(moment(p[1].ets).format('DD/MM/YYYY HH:mm:ss')),
                            toC(p[1].t),
                            toC(p[1].email),
                            toC(p[1].displayName),
                            toC(p[1].status),
                            toC('12321'),
                            toC('12321'),
                            toC('12321'),
                            toC('12321')
                        ];
                    }));

            console.warn('data:');
            console.warn(data);

            zipcelx({
                filename: this.formatDate(new Date()) + '-pedidos',
                sheet: {data}
            });
        });
    },

    renderItem(i, idx) {
        return <div key={idx} style={{display: 'flex', minHeight: '30px', justifyContent: 'space-between'}}>

            <div style={{display: 'flex', alignItems: 'center'}} className="md-text ptext-wrap md-font-semibold">{i.n + ' - ' + i.plate}</div>

            <div style={{display: 'flex', alignItems: 'flex-end'}}>
                <Button icon onClick={() => this.onEdit(i)}>edit</Button>
                <Button icon onClick={() => this.onDelete(i)}>delete</Button>
            </div>
        </div>;
    },

    render() {
        const m = this.props.model;
        const items = _.sortBy(_.toPairs(this.props.model.cars).map(i => ({...m.families[i[1]], plate: i[0], familyId: i[1]})), ['n']);

        return <div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginRight: '8px', marginTop: '5px'}}>
                <Button icon onClick={this.onDownloadRequests}>cloud_download</Button>
            </div>

            <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{display: 'flex', flexDirection: 'column', marginTop: '5px'}}>

                {items.map(this.renderItem)}

                <div style={{marginBottom: '50px'}}>&nbsp;</div>

            </div>
        </div>;
    }
});

AdminData.propTypes = {
    model: PropTypes.object.isRequired,
    onEditFamily: PropTypes.func.isRequired,
    db: PropTypes.object.isRequired
};
export default AdminData;
