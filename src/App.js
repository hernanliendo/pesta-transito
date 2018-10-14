import React, {Component} from 'react';
import {Avatar, BottomNavigation, Button, FontIcon, SelectionControl, Snackbar, TextField, Toolbar} from 'react-md';
import Loadable from 'react-loadable';

import Students from "./components/Students";
import Loader from "./components/Loader";
import './App.css';

const firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

const rp = require('request-promise');
const _ = require('lodash');
const wait = require('wait-promise');

const FUNCTIONS_TOKEN = 'JKL93uJFJ939VBN5451J4K8gkjhshj89n';
const VERSION = '0.51';
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyA_0_hHLyMU-42F-nR0XdQnJsdDpO9aNVA',
    authDomain: 'pesta-transito.firebaseapp.com',
    databaseURL: 'https://pesta-transito.firebaseio.com',
    projectId: 'pesta-transito',
    storageBucket: 'pesta-transito.appspot.com',
    messagingSenderId: '165908723273'
};

const AdminData = Loadable({
    loader: () => import('./components/AdminData'),
    loading() {
        return <Loader/>;
    }
});

const AddNewCar = Loadable({
    loader: () => import('./components/AddNewCar'),
    loading() {
        return <Loader/>;
    }
});

const SignIn = Loadable({
    loader: () => import('./components/SignIn'),
    loading() {
        return <Loader/>;
    }
});

const NoAccess = Loadable({
    loader: () => import('./components/NoAccess'),
    loading() {
        return <Loader/>;
    }
});

const NoConnection = Loadable({
    loader: () => import('./components/NoConnection'),
    loading() {
        return <Loader/>;
    }
});

const relations = ['Madre/Padre', 'Abuela/o', 'Empleada/o', 'Tia/o'];

class App extends Component {

    constructor(props) {
        super(props);

        this.model = {};

        this.state = {
            requests: [],
            noAccess: false,

            connected: true,
            initializing: true,
            user: {},

            isAdmin: false,
            isTeacher: false,

            editingFamily: null,

            toasts: [],
            tabIndex: 0,

            addingNotes: null,

            searchText: '',
            addingNewCar: false,
            searchResult: []
        };
    }

    flatten(o) {
        if (!o) return {};
        return [].concat(...Object.keys(o).map(k => typeof o[k] === 'object' ? this.flatten(o[k]) : ({[k]: o[k]})));
    }

    saveEvent(evt) {
        if (!evt) return;

        const params = {
            ...evt,
            displayName: _.get(this, 'user.displayName', '')
        };

        rp({
            method: 'POST',
            uri: 'https://us-central1-pesta-transito.cloudfunctions.net/log_event',
            body: {
                token: FUNCTIONS_TOKEN,
                t: evt['t'] || 'log',
                e: _.get(this, 'user.email', ''),
                uid: _.get(this, 'user.uid', ''),
                params
            },
            json: true
        }).then();
    }

    onEditFamily(f) {
        this.setState({...this.state, editingFamily: f, tabIndex: 1, addingNewCar: true});
    }

    componentWillMount() {
        firebase.initializeApp(FIREBASE_CONFIG);

        firebase.auth().languageCode = 'es';
        this.database = firebase.database();

        this.saveEvent({v: 'after f.db'});

        firebase.auth().onAuthStateChanged(user => {
            this.saveEvent({v: 'onAuthStateChanged', user: (user ? user.uid : 'noid')});

            if (!user)
                this.setState({...this.state, initializing: false});
            else {
                this.user = user;

                this.database
                    .ref(`users/${user.uid}/displayName`)
                    .set(user.displayName)
                    .then(() => this.listenModel())
                    .then(() => this.setState({...this.state, initializing: false, user: {displayName: user.displayName, uid: user.uid, email: user.email}}))
                    .then(() => this.saveEvent({v: 'onAuthStateChanged done', user: (user ? user.uid : 'noid')}))
            }
        });
    }

    listenModel() {
        this.database.ref('2018').on('value', snapshot => {
            this.model = snapshot.val();
            this.forceUpdate();
            this.saveEvent({v: 'got model'});

        }, () => this.setState({...this.state, noAccess: true}));

        this.database.ref('requests').on('value', snapshot => {
            const items = snapshot.val();

            this.setState({...this.state, requests: !items ? [] : _.toPairs(items).filter(p => p[1].family).map(i => ({...i[1], k: i[0]}))});
        });

        this.database.ref('users').on('value', snapshot => this.setState({...this.state, users: snapshot.val()}));

        this.database.ref('admins').on('value', snapshot => this.setState({...this.state, isAdmin: snapshot.val()[this.user.uid]}));

        this.database.ref('teachers').on('value', snapshot => this.setState({...this.state, isTeacher: !!snapshot.val()[this.user.uid]}));

        this.database.ref('.info/connected').on('value', snap => {
            const conn = snap.val();
            this.setState({...this.state, connected: conn});
            this.saveEvent({v: 'got model' + conn});
        });
    }

    onDelivered(rk) {
        const request = this.state.requests.filter(r => r.k === rk)[0];

        this.database
            .ref('requests/' + rk)
            .set(null, () => this.showMessage('Se entregaron chicos a ' + request.plate))
            .then(() => this.saveEvent({t: 'delivered', request}));
    }

    showMessage(msg) {
        this.setState({...this.state, toasts: this.state.toasts.concat({text: msg})});
    }

    textChanged(t) {
        const v = t.replace(/[^a-z0-9]/gi, '').toUpperCase();

        if (v.length <= 7)
            this.setState({...this.state, searchText: v, searchResult: v.length === 0 ? [] : Object.keys(this.model.cars).filter(c => c.indexOf(v) !== -1)});
    }

    async clearText() {
        this.setState({...this.state, searchText: '', searchResult: []});

        await wait.sleep(400);

        if (this.plateSearchRef)
            this.plateSearchRef.focus();
    }

    renderResults(plate, ridx) {
        const family = this.model.families[this.model.cars[plate]];

        if (!family) return <div/>;

        return <div onClick={() => this.setState({...this.state, addingNotes: {plate, family}, searchText: '', searchResult: []})}
                    key={ridx} style={{display: 'flex', marginBottom: '25px', minHeight: '100px', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{marginRight: '10px', minWidth: '40px'}}>
                <Avatar icon={<FontIcon>directions_car</FontIcon>}/>
            </div>

            <div style={{marginRight: '10px', width: 'calc(100vw - 225px)', maxHeight: '100px'}}>
                <div className="md-text ptext-wrap md-font-semibold">{plate + ' ' + family.n}</div>

                {_.toPairs(family.ks).map(p => <div key={p[0]} className="md-text--secondary ptext-wrap">{p[0] + ', ' + p[1]}</div>)}

            </div>

            <div style={{display: 'flex', flexDirection: 'column', minWidth: '120px'}}>
                <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.setState({...this.state, addingNotes: {plate, family}, searchText: '', searchResult: []})}>SELECCIONAR</Button>
            </div>
        </div>;
    }

    hideNotes() {
        this.setState({...this.state, addingNotes: null, searchText: '', searchResult: []});
    }

    confirmNotes() {
        const notes = this.notesText.value;
        const params = this.state.addingNotes;

        let r = {
            plate: params.plate,
            family: params.family,
            uid: this.state.user.uid
        };

        if (notes && notes.trim().length > 0) r.notes = notes.trim();

        if (params.unrequested) {
            let ur = {};
            _.toPairs(params.unrequested).filter(p => p[1]).forEach(p => ur[p[0]] = true);
            if (Object.keys(ur).length > 0) r.unrequested = ur;
        }

        if (this.state.requests.filter(ri => ri.plate === r.plate).length === 0) {
            const newRequestRef = this.database.ref('requests').push();

            newRequestRef
                .set(r, () => {
                    this.showMessage('Se ha notificado al Colegio');

                    let order = 0;

                    (this.state.requests || []).filter(rr => rr['ord']).forEach(rr => order = rr['ord']);

                    order++;

                    return this.database.ref('requests/' + newRequestRef.key + '/ord').set(order);
                })
                .then(() => this.saveEvent({t: 'request', request: r}));
        }
        this.hideNotes();
    }

    changeRequestStudent(idx) {
        let unrequested = {...this.state.addingNotes.unrequested};
        unrequested[idx] = unrequested[idx] ? !unrequested[idx] : true;
        this.setState({...this.state, addingNotes: {...this.state.addingNotes, unrequested}});
    }

    newCarConfirmed(newFamilyCar) {
        const familyIdRef = newFamilyCar.familyId ? this.database.ref('2018/families/' + newFamilyCar.familyId) : this.database.ref('2018/families').push();

        familyIdRef.set(newFamilyCar.family, () => {
            const id = familyIdRef.toString().substring(familyIdRef.toString().lastIndexOf('/') + 1);

            this.database
                .ref('2018/cars/' + newFamilyCar.car)
                .set(
                    id,
                    () => this.setState({
                        ...this.state,
                        editingFamily: null,
                        addingNewCar: false,
                        searchText: '',
                        searchResult: [],
                        toasts: this.state.toasts.concat({text: 'Se ha agregado la nueva familia'})
                    })
                )
                .then(() => this.saveEvent({t: 'newCar', newFamilyCar}));
        });
    }

    changeStatus(request, status) {
        const rk = request.k;
        const saveE = () => this.saveEvent({t: 'changeStatus', rk, status});

        if (status === 'teacherDelivered')
            this.database
                .ref('requests/' + rk + '/teacherHidden')
                .set(1)
                .then(saveE);

        else if (status === 'requestWhatsApp') {
            this.database
                .ref('requests/' + rk + '/statuses')
                .push()
                .set({state: status, uid: this.state.user.uid})
                .then(() => rp({
                    method: 'POST',
                    uri: 'https://us-central1-pesta-transito.cloudfunctions.net/notify_parent',
                    body: {
                        requestId: rk,
                        token: FUNCTIONS_TOKEN
                    },
                    json: true
                }))
                .catch(err => this.saveEvent({t: 'error', rk, status, error: err.stack}))
                .then(saveE);
        }
        else
            this.database
                .ref('requests/' + rk + '/statuses')
                .push()
                .set({state: status, uid: this.state.user.uid})
                .then(saveE);
    }

    renderPlatesSearch() {
        if (this.state.addingNewCar) return <AddNewCar previousPlate={this.state.searchText}
                                                       showMessage={m => this.showMessage(m)}
                                                       model={this.model}
                                                       editingFamily={this.state.editingFamily}
                                                       relations={relations}
                                                       onConfirmed={newFamilyCar => this.newCarConfirmed(newFamilyCar)}
                                                       onCancel={() => this.setState({...this.state, editingFamily: null, addingNewCar: false, searchText: '', searchResult: []})}/>;

        const plates = this.state.searchResult;
        const searchText = this.state.searchText;

        return <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{marginTop: '4px', display: 'flex', flexDirection: 'column'}}>

            <div style={{display: 'flex', alignItems: 'flex-end', marginTop: '-9px'}}>
                <TextField
                    id="patente"
                    label="Patente"
                    ref={ref => this.plateSearchRef = ref}
                    fullWidth
                    leftIcon={<FontIcon>directions_car</FontIcon>}
                    onChange={v => this.textChanged(v)}
                    value={this.state.searchText}
                    lineDirection="center"
                    className="md-cell md-cell--bottom"
                />

                {searchText.length > 0 &&
                <Button onClick={() => this.clearText()} style={{marginBottom: '10px', marginLeft: '-50px'}} icon iconChildren={<FontIcon>clear</FontIcon>}/>
                }
            </div>

            <div style={{display: 'flex', flexDirection: 'column'}}>
                {
                    (plates.length === 0 && this.state.searchText.length > 0) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <Button style={{fontSize: '18px'}} flat primary onClick={() => this.setState({...this.state, addingNewCar: true})}>AGREGAR AUTO</Button>
                        <span className="md-caption" style={{fontSize: '30px'}}>Sin resultados</span>
                        <FontIcon style={{fontSize: '250px'}}>directions_car</FontIcon>
                    </div>
                }

                {plates.map((p, ridx) => this.renderResults(p, ridx))}

                <div style={{marginBottom: '50px'}}>&nbsp;</div>

            </div>

            {(plates.length === 0 && this.state.searchText.length === 0 && !this.state.addingNotes) &&
            <div className="md-caption" style={{position: 'absolute', bottom: '60px'}}>
                <div>
                    Aquí podés ingresar la patente de un auto que está esperando por sus hijos. Cuando lo confirmes un aviso se enviará al Colegio
                </div>
                <div style={{display: 'flex', marginTop: '5px', justifyContent: 'center'}}>
                    ¿Feedback? Escribinos&nbsp;<a href="mailto:hernan.liendo@gmail.com?Subject=Pesta Transito" target="_top">aquí</a>
                </div>
            </div>
            }
        </div>;
    }

    render() {
        if (this.state.initializing) return <Loader/>;

        if (!this.user) return <SignIn firebase={firebase}/>;

        if (!this.model && !this.state.noAccess) return <Loader/>;

        if (this.state.noAccess) return <NoAccess/>;

        if (!this.state.connected) return <NoConnection/>;

        if (!this.state.users) return <Loader/>;

        return <div>
            <Toolbar
                id="ptoolbar"
                colored
                fixed
                // actions={<Button key="action" icon>more_vert</Button>}
                title={<div>
                    <span style={{fontSize: '13px !important'}} className="md-title md-title--toolbar">{this.state.user.displayName}</span>
                    <span style={{fontSize: '8px', marginLeft: '5px'}} className="md-caption md-title--toolbar">{'(v' + VERSION + ')'}</span>
                </div>}
            />

            <div style={{marginBottom: '5px'}}>&nbsp;</div>

            {(!this.state.addingNotes && this.state.tabIndex === 0) &&
            <Students
                requests={this.state.requests}
                users={this.state.users}
                isTeacher={this.state.isTeacher}
                currentUser={this.state.user}
                onDelivered={rk => this.onDelivered(rk)}
                onChangeStatus={(request, status) => this.changeStatus(request, status)}
            />
            }

            {this.state.tabIndex === 1 && this.renderPlatesSearch()}

            {this.state.tabIndex === 2 && <AdminData
                model={this.model}
                relations={relations}
                users={this.state.users}
                db={this.database}
                onEditFamily={f => this.onEditFamily(f)}
            />}

            {this.state.addingNotes &&
            <div style={{display: 'flex', flexDirection: 'column', margin: '25px'}}>
                <span className="md-caption">Vas a solicitar que traigan alumnos.</span>

                {_.toPairs(this.state.addingNotes.family.ks).map((p, idx) =>
                    <SelectionControl
                        key={idx}
                        id={idx}
                        name={idx}
                        label={p[0] + ', ' + p[1]}
                        type="checkbox"
                        checked={!_.get(this.state, 'addingNotes.unrequested.' + idx)}
                        onChange={() => this.changeRequestStudent(idx)}
                    />
                )}

                <TextField
                    id="notes-text"
                    label="Notas o aclaraciones"
                    ref={notesText => this.notesText = notesText}
                    fullWidth
                    lineDirection="center"
                />

                <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '30px'}}>
                    <Button raised primary style={{minWidth: '110px'}} onClick={() => this.confirmNotes()}>Confirmo</Button>
                    <Button raised secondary style={{minWidth: '110px'}} onClick={() => this.hideNotes()}>Cancelo</Button>
                </div>
            </div>
            }

            <Snackbar id="notifications-bar" toasts={this.state.toasts} autohideTimeout={4000} onDismiss={() => this.setState({...this.state, toasts: _.tail(this.state.toasts)})}/>

            {(!this.state.addingNotes) &&
            <BottomNavigation
                links={[
                    {label: 'ALUMNOS', icon: <FontIcon>face</FontIcon>},
                    {label: 'AUTOS', icon: <FontIcon>directions_car</FontIcon>}
                ].concat(this.state.isAdmin ? [{label: 'DATOS', icon: <FontIcon>folder_shared</FontIcon>}] : [])}
                dynamic={false}
                colored
                onNavChange={activeIndex => this.setState({...this.state, tabIndex: activeIndex})}
            />
            }
        </div>;
    }
}

export default App;
