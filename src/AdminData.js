import React from "react";
import PropTypes from "prop-types";
import {Button, Divider} from "react-md";
// import zipcelx from "zipcelx";

const _ = require('lodash');

class AdminData extends React.Component {

    onDelete(i) {
        const carsToDelete = _.toPairs(this.props.model.cars).filter(p => p[1] === i.familyId).map(p => p[0]);
        if (carsToDelete.length > 0) {
            this.props.db.ref('2018/families/' + i.familyId).set(null);
            this.props.db.ref('2018/cars/' + carsToDelete[0]).set(null);
        }
    }

    onEdit(i) {
        this.props.onEditFamily(i);
    }

    // formatDate(date) {
    //     let d = new Date(date),
    //         month = '' + (d.getMonth() + 1),
    //         day = '' + d.getDate(),
    //         year = d.getFullYear();
    //
    //     if (month.length < 2) month = '0' + month;
    //     if (day.length < 2) day = '0' + day;
    //
    //     return [year, month, day].join('-');
    // }

    // onDownloadRequests() {
    //     const toC = v => ({value: v || '', type: 'string'});
    //     const usedKeys = ['car', 'displayName', 'n', 'status', 'emailVerified', 'email', 't', 'ets', 'rk', 'k', 'plate', 'state', 'uid', 'notes'];
    //
    //     this.props.db.ref('events').once('value').then(snapshot => {
    //         const data =
    //             [[
    //                 toC('Fecha'), toC('Tipo'), toC('Email'), toC('Nombre'), toC('Estado'), toC('Familia'), toC('Patente'), toC('Notas'),
    //                 toC('Conductor 1'), toC('Relación Conductor 1'), toC('Conductor 2'), toC('Relación Conductor 2'), toC('Chico/a 1'), toC('Grado Chico/a 1'),
    //                 toC('Chico/a 2'), toC('Grado Chico/a 2'), toC('Chico/a 3'), toC('Grado Chico/a 3'), toC('Chico/a 4'), toC('Grado Chico/a 4')
    //             ]]
    //                 .concat(_.toPairs(snapshot.val())
    //                     .filter(p => p[1].t !== 'newCar')
    //                     .map(p => {
    //                         const otherFields = _.toPairs(p[1]).filter(i => _.indexOf(usedKeys, i[0]) === -1).filter(i => !_.isEmpty(i));
    //                         const drivers = otherFields.filter(i => _.indexOf(this.props.relations, i[1]) >= 0);
    //                         const students = _.difference(otherFields, drivers);
    //
    //                         return [
    //                             toC(moment(p[1].ets).format('DD/MM/YYYY HH:mm:ss')),
    //                             toC(p[1].t),
    //                             toC(p[1].email),
    //                             toC(p[1].displayName),
    //                             toC(p[1].status),
    //                             toC(p[1].n),
    //                             toC(p[1].car),
    //                             toC(p[1].notes),
    //                             toC(_.get(drivers, '[0][0]', '')),
    //                             toC(_.get(drivers, '[0][1]', '')),
    //                             toC(_.get(drivers, '[1][0]', '')),
    //                             toC(_.get(drivers, '[1][1]', '')),
    //                             toC(_.get(students, '[0][0]', '')),
    //                             toC(_.get(students, '[0][1]', '')),
    //                             toC(_.get(students, '[1][0]', '')),
    //                             toC(_.get(students, '[1][1]', '')),
    //                             toC(_.get(students, '[2][0]', '')),
    //                             toC(_.get(students, '[2][1]', '')),
    //                             toC(_.get(students, '[3][0]', '')),
    //                             toC(_.get(students, '[3][1]', ''))
    //                         ]
    //                     }));
    //
    //         zipcelx({
    //             filename: this.formatDate(new Date()) + '-pedidos',
    //             sheet: {data}
    //         });
    //     });
    // }

    renderItem(i, idx) {
        return <div key={idx} style={{display: 'flex', minHeight: '30px', justifyContent: 'space-between'}}>

            <div style={{display: 'flex', alignItems: 'center'}} className="md-text ptext-wrap md-font-semibold">{i.n + ' - ' + i.plate}</div>

            <div style={{display: 'flex', alignItems: 'flex-end'}}>
                <Button icon onClick={() => this.onEdit(i)}>edit</Button>
                <Button icon onClick={() => this.onDelete(i)}>delete</Button>
            </div>
        </div>;
    }

    approve(id) {
        this.props.db.ref(`users/${id}/valid`).set(1);
    }

    renderPending(i, idx) {
        return <div key={idx} style={{display: 'flex', minHeight: '30px', justifyContent: 'space-between'}}>

            <div style={{display: 'flex', alignItems: 'center'}} className="md-text ptext-wrap md-font-semibold">{i[1].displayName}</div>

            <div style={{display: 'flex', alignItems: 'flex-end'}}>
                <Button icon onClick={() => this.approve(i[0])}>thumb_up</Button>
            </div>
        </div>;
    }

    render() {
        const m = this.props.model;
        const pendingUsers = _.toPairs(this.props.users).filter(p => !p[1].valid);
        const items = _.sortBy(_.toPairs(this.props.model.cars).map(i => ({...m.families[i[1]], plate: i[0], familyId: i[1]})), ['n']);

        return <div style={{marginLeft: '10px'}}>
            {/*<div style={{display: 'flex', justifyContent: 'flex-end', marginRight: '8px', marginTop: '5px'}}>*/}
            {/*<Button icon onClick={this.onDownloadRequests}>cloud_download</Button>*/}
            {/*</div>*/}

            <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{display: 'flex', flexDirection: 'column', marginTop: '5px'}}>

                {pendingUsers.map(this.renderPending)}

                {items.map(this.renderItem)}

                {pendingUsers.length > 0 && <Divider/>}

                <div style={{marginBottom: '50px'}}>&nbsp;</div>

            </div>
        </div>;
    }
}

AdminData.propTypes = {
    model: PropTypes.object.isRequired,
    users: PropTypes.object.isRequired,
    relations: PropTypes.array.isRequired,
    onEditFamily: PropTypes.func.isRequired,
    db: PropTypes.object.isRequired
};
export default AdminData;
