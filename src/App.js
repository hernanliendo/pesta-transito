import React from 'react';

import BottomNavigation from 'react-md/lib/BottomNavigations/BottomNavigation';
import Button from 'react-md/lib/Buttons/Button';
import FontIcon from 'react-md/lib/FontIcons/FontIcon';
import SelectionControl from 'react-md/lib/SelectionControls/SelectionControl';
import Snackbar from 'react-md/lib/Snackbars/SnackbarContainer';
import TextField from 'react-md/lib/TextFields/TextField';
import Toolbar from 'react-md/lib/Toolbars/Toolbar';

import Loadable from 'react-loadable';
import {version} from '../package.json'

import Loader from "./components/Loader";
import './App.css';

const firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

const _ = require('lodash');

const FUNCTIONS_TOKEN = 'JKL93uJFJ939VBN5451J4K8gkjhshj89n';
const VERSION = version;
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

const Students = Loadable({
    loader: () => import('./components/Students'),
    loading() {
        return <Loader/>;
    }
});

const SearchCar = Loadable({
    loader: () => import('./components/SearchCar'),
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

// npx source-map-explorer 'build/static/js/*.js'
class App extends React.Component {

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
            isJardinFamilyAdmin: false,
            isTeacher: false,

            viewJardin: false,

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

        fetch('https://us-central1-pesta-transito.cloudfunctions.net/log_event', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: FUNCTIONS_TOKEN,
                t: evt['t'] || 'log',
                e: _.get(this, 'user.email', ''),
                uid: _.get(this, 'user.uid', ''),
                params
            })
        }).then();
    }

    onEditFamily(f) {
        this.setState({...this.state, editingFamily: f, tabIndex: 1, addingNewCar: true});
    }

    componentDidMount() {
        Loadable.preloadAll();
    }

    componentWillMount() {
        firebase.initializeApp(FIREBASE_CONFIG);

        firebase.auth().languageCode = 'es';
        this.database = firebase.database();

        // this.saveEvent({v: 'after f.db'});

        firebase.auth().onAuthStateChanged(user => {
            // this.saveEvent({v: 'onAuthStateChanged', user: (user ? user.uid : 'noid')});

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
            // this.saveEvent({v: 'got model'});

        }, () => this.setState({...this.state, noAccess: true}));

        this.database.ref('requests').on('value', snapshot => {
            const items = snapshot.val();

            this.setState({...this.state, requests: !items ? [] : _.toPairs(items).filter(p => p[1].family).map(i => ({...i[1], k: i[0]}))});
        });

        this.database.ref('users').on('value', snapshot => {
            const users = snapshot.val();

            this.setState({...this.state, users, viewJardin: users[this.user.uid].nivel === 'Jardín'});
        });

        this.database.ref('admins').on('value', snapshot => {
            const type = snapshot.val()[this.user.uid];

            this.setState({...this.state, isAdmin: type === 1 || type === 2, isJardinFamilyAdmin: type === 2})
        });

        this.database.ref('teachers').on('value', snapshot => this.setState({...this.state, isTeacher: !!snapshot.val()[this.user.uid]}));

        this.database.ref('.info/connected').on('value', snap => {
            const conn = snap.val();
            this.setState({...this.state, connected: conn});
            // this.saveEvent({v: 'got model' + conn});
        });
    }

    onDelivered(rk) {
        const request = this.state.requests.filter(r => r.k === rk)[0];
        const hasJardin = _.toPairs(request.family.ks).filter(p => p[1].indexOf('Sala') !== -1).length > 0;
        const hasPrimaria = _.toPairs(request.family.ks).filter(p => p[1].indexOf('Sala') === -1).length > 0;
        const hasHermanos = hasJardin && hasPrimaria;

        if (hasHermanos) {
            // solving 11th position and removing jardin kids
            let pos = 100;
            const currentRequests = this.state.requests;

            for (let i = 0; i < currentRequests.length; i++) {
                // console.log('currentRequests[i].ord', currentRequests[i].ord);
                pos = currentRequests[i].ord;

                if (i === 10)
                    break;
            }

            Promise.all(
                _.toPairs(request.family.ks)
                    .filter(p => p[1].startsWith('Sala'))
                    .map(p => new Promise(resolve => this.database.ref(`requests/${rk}/family/ks/${p[0]}`).set(null, () => resolve())))
            )
                .then(() => new Promise(resolve =>
                    this.database.ref(`requests/${rk}/ord`).set(pos + 1, () => this.database.ref(`requests/${rk}/jardinDone`).set(1, () =>
                        this.database
                            .ref(`requests/${rk}/statuses`)
                            .push()
                            .set({state: 'pending', uid: this.state.user.uid}, () => resolve())))))
                .then(() => this.saveEvent({t: 'delivered', request: {...request, fromJardin: true}}));
        } else
            this.database
                .ref('requests/' + rk)
                .set(null, () => this.showMessage('Se entregaron chicos a ' + request.plate))
                .then(() => this.saveEvent({t: 'delivered', request}));
    }

    onRemoved(rk) {
        const request = this.state.requests.filter(r => r.k === rk)[0];

        this.database
            .ref('requests/' + rk)
            .set(null, () => this.showMessage('Se ha eliminado el pedido de ' + request.plate))
            .then(() => this.saveEvent({t: 'removed', request}));
    }

    showMessage(msg) {
        this.setState({...this.state, toasts: this.state.toasts.concat({text: msg})});
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

                    order += 100;

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
                .then(() => fetch('https://us-central1-pesta-transito.cloudfunctions.net/notify_parent', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        requestId: rk,
                        request,
                        token: FUNCTIONS_TOKEN
                    })
                }))
                .catch(err => this.saveEvent({t: 'error', rk, status, error: err.stack}))
                .then(saveE);
        } else
            this.database
                .ref('requests/' + rk + '/statuses')
                .push()
                .set({state: status, uid: this.state.user.uid})
                .then(saveE);
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

            <div style={{marginBottom: '3px'}}>&nbsp;</div>

            {(!this.state.addingNotes && this.state.tabIndex === 0) &&
            <Students
                requests={this.state.requests.sort((r1, r2) => r1.ord - r2.ord)}
                users={this.state.users}
                viewJardin={this.state.viewJardin}
                onChangeView={viewJardin => this.setState({...this.state, viewJardin})}
                isTeacher={this.state.isTeacher}
                currentUser={this.state.user}
                onDelivered={rk => this.onDelivered(rk)}
                onRemoved={rk => this.onRemoved(rk)}
                onChangeStatus={(request, status) => this.changeStatus(request, status)}
            />
            }

            {this.state.tabIndex === 1 && <SearchCar
                showMessage={m => this.showMessage(m)}
                newCarConfirmed={m => this.newCarConfirmed(m)}
                model={this.model}
                relations={relations}
                state={this.state}
                isJardinFamilyAdmin={this.state.isJardinFamilyAdmin}
                setState={s => this.setState(s)}
            />}

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
