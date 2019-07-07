import React, {useState} from "react";
import PropTypes from "prop-types";
import Button from 'react-md/lib/Buttons/Button';
import Subheader from 'react-md/lib/Subheaders/Subheader';
import TextField from "react-md/lib/TextFields";
import FontIcon from "react-md/lib/FontIcons";

// import zipcelx from "zipcelx";

const _ = require('lodash');

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
//     props.db.ref('events').once('value').then(snapshot => {
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
//                         const drivers = otherFields.filter(i => _.indexOf(props.relations, i[1]) >= 0);
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

const onDelete = (props, i) => {
    const carsToDelete = _.toPairs(props.model.cars).filter(p => p[1] === i.familyId).map(p => p[0]);

    if (carsToDelete.length === 0)
        return;

    props.db.ref('2018/families/' + i.familyId).set(null)
        .then(() => props.db.ref('2018/cars/' + carsToDelete[0]).set(null));
};

const title = t =>
    <Subheader style={{listStyleType: 'none', fontSize: '22px', marginTop: '60px'}} primary primaryText={t}/>;

const renderItem = (props, i, idx) =>
    <div key={idx} style={{display: 'flex', minHeight: '30px', justifyContent: 'space-between'}}>

        <div style={{display: 'flex', alignItems: 'center'}} className="md-text ptext-wrap md-font-semibold">{i.n + ' - ' + i.plate}</div>

        <div style={{display: 'flex', alignItems: 'flex-end'}}>
            <Button icon onClick={() => props.onEditFamily(i)}>edit</Button>
            <Button icon onClick={() => onDelete(props, i)}>delete</Button>
        </div>
    </div>;

const deleteVolunteer = (props, id, readyToDelete, setReadyToDelete) => {
    if (readyToDelete) {
        props.db.ref(`users/${id}`).remove();
        setReadyToDelete(null);
    } else
        setReadyToDelete(id);
};

// const changeSchool = (props, id, user) => {
//     let r = 'Primaria';
//
//     if (!user.nivel || user.nivel === 'Primaria')
//         r = 'Jardín';
//     else if (user.nivel === 'Jardín')
//         r = 'Primaria y Jardín';
//     else if (user.nivel === 'Primaria y Jardín')
//         r = 'Primaria';
//
//     props.db.ref(`users/${id}/nivel`).set(r);
// };

const renderUser = (props, i, idx, isPending, readyToDelete, setReadyToDelete) =>
    <div key={idx} style={{display: 'flex', minHeight: '30px', justifyContent: 'space-between'}}>

        <div style={{display: 'flex', alignItems: 'center'}} className="md-text ptext-wrap md-font-semibold">{i[1].displayName + ' (' + (i[1].nivel || 'Primaria') + ')'}</div>

        <div style={{display: 'flex', alignItems: 'flex-end'}}>
            {isPending &&
            <Button icon onClick={() => props.db.ref(`users/${i[0]}/valid`).set(1)}>thumb_up</Button>
            }

            {/*
            !isPending &&
            <Button icon onClick={() => changeSchool(i[0], i[1])}>autorenew</Button>
            */}

            <Button style={{color: i[0] === readyToDelete ? '#F44336' : 'rgba(0, 0, 0, 0.54)'}} icon
                    onClick={() => deleteVolunteer(props, i[0], readyToDelete, setReadyToDelete)}>delete</Button>
        </div>
    </div>;


const AdminData = props => {
    const [readyToDelete, setReadyToDelete] = useState(null);
    const [search, setSearch] = useState('');
    const m = props.model;
    const toSearch = search && search.trim().length > 0 ? search.trim().toLowerCase() : null;
    const searchUserFilter = itm => !toSearch || itm[1].displayName.toLowerCase().indexOf(toSearch) !== -1;
    const searchFamilyFilter = itm => !toSearch || itm.n.toLowerCase().indexOf(toSearch) !== -1;
    const activeUsers = _.sortBy(_.toPairs(props.users).filter(p => p[1].valid), p => _.get(p[1], 'displayName', '').toLowerCase()).filter(searchUserFilter);
    const pendingUsers = _.toPairs(props.users).filter(p => !p[1].valid).filter(searchUserFilter);
    const items = _.sortBy(
        _.toPairs(props.model.cars)
            .map(i => ({...m.families[i[1]], plate: i[0], familyId: i[1]}))
            .filter(searchFamilyFilter)
        , usr => _.get(usr, 'n', '').toLowerCase());

    return <div style={{marginLeft: '10px'}}>
        {/*<div style={{display: 'flex', justifyContent: 'flex-end', marginRight: '8px', marginTop: '5px'}}>*/}
        {/*<Button icon onClick={this.onDownloadRequests}>cloud_download</Button>*/}
        {/*</div>*/}

        <div style={{display: 'flex', justifyContent: 'center', marginTop: '10px'}}>
            <TextField
                id="adminsearch"
                label="Búsqueda"
                fullWidth
                leftIcon={<FontIcon>search</FontIcon>}
                onChange={v => setSearch(v)}
                value={search}
                lineDirection="center"
                className="md-cell md-cell--bottom"
            />
        </div>

        <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{display: 'flex', flexDirection: 'column', marginTop: '5px'}}>

            {pendingUsers.length > 0 && title('Autorizaciones Pendientes')}
            {pendingUsers.map((itm, idx) => renderUser(props, itm, idx, true, readyToDelete, setReadyToDelete))}


            {title('Voluntarios')}
            {activeUsers.map((itm, idx) => renderUser(props, itm, idx, false, readyToDelete, setReadyToDelete))}


            {title('Familias')}
            {items.map((itm, idx) => renderItem(props, itm, idx))}

            <div style={{marginBottom: '50px'}}>&nbsp;</div>

        </div>
    </div>;
};


AdminData.propTypes = {
    model: PropTypes.object.isRequired,
    users: PropTypes.object.isRequired,
    relations: PropTypes.array.isRequired,
    onEditFamily: PropTypes.func.isRequired,
    db: PropTypes.object.isRequired
};
export default AdminData;
