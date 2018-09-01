import React, {Component} from 'react';
import {Avatar, BottomNavigation, Button, Card, FontIcon, SelectionControl, Snackbar, TextField, Toolbar} from 'react-md';
import Students from "./Students";
import AdminData from "./AdminData";
import AddNewCar from "./AddNewCar";
import Logo from './logo.png';
import './App.css';
import './firebaseui.css';

const firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

const _ = require('lodash');
const wait = require('wait-promise');

const VERSION = '0.41';
const DEV = false;
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyA_0_hHLyMU-42F-nR0XdQnJsdDpO9aNVA',
    authDomain: 'pesta-transito.firebaseapp.com',
    databaseURL: 'https://pesta-transito.firebaseio.com',
    projectId: 'pesta-transito',
    storageBucket: 'pesta-transito.appspot.com',
    messagingSenderId: '165908723273'
};

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
        if (!this.user) return;

        this.database.ref('events').push().set(Object.assign({
            ets: firebase.database.ServerValue.TIMESTAMP,
            displayName: this.user.displayName || 'no name',
            email: this.user.email,
            emailVerified: this.user.emailVerified || false,
        }, ...this.flatten(evt)));
    }

    onEditFamily(f) {
        this.setState({...this.state, editingFamily: f, tabIndex: 0, addingNewCar: true});
    }

    componentWillMount() {
        firebase.initializeApp(FIREBASE_CONFIG);

        firebase.auth().languageCode = 'es';
        this.database = firebase.database();

        if (DEV) {
            const u = {uid: 'SJDQJKXhHZd5ir7YdJNbljbStJg1', displayName: 'Hernan', email: 'hernan@test.com'};
            this.user = u;
            this.listenModel();
            this.setState({...this.state, initializing: false, user: u});
            return;
        }

        firebase.auth().onAuthStateChanged(user => {
            if (!user)
                this.setState({...this.state, initializing: false});
            else {
                this.user = user;

                this.database.ref(`users/${user.uid}/displayName`).set(user.displayName);

                this.listenModel();

                this.setState({...this.state, initializing: false, user: {displayName: user.displayName, uid: user.uid, email: user.email}});
            }
        });
    }

    listenModel() {
        this.database.ref('2018').on('value', snapshot => {
            this.model = snapshot.val();
            this.forceUpdate();
        }, () => this.setState({...this.state, noAccess: true}));

        this.database.ref('requests').on('value', snapshot => {
            const items = snapshot.val();

            const ts = setTimeout(() => {
                this.setState({...this.state, requests: !items ? [] : _.toPairs(items).map(i => ({...i[1], k: i[0]}))});
                if (ts) clearTimeout(ts);
            }, 200);

            if (items) {
                let newOrd = 0;

                _.toPairs(items).forEach(pp => newOrd = pp[1].ord && pp[1].ord > newOrd ? pp[1].ord : newOrd);
                newOrd++;

                _.toPairs(items)
                    .filter(pp => pp[1].uid === this.user.uid && !pp[1].ord)
                    .forEach(pp => this.database.ref(`requests/${pp[0]}/ord`).set(newOrd));
            }
            this.forceUpdate();
        });

        this.database.ref('users').on('value', snapshot => this.setState({...this.state, users: snapshot.val()}));

        this.database.ref('admins').on('value', snapshot => this.setState({...this.state, isAdmin: snapshot.val()[this.user.uid]}));

        this.database.ref('.info/connected').on('value', snap => this.setState({...this.state, connected: snap.val()}));
    }

    onDelivered(rk) {
        const request = this.state.requests.filter(r => r.k === rk)[0];

        this.saveEvent({t: 'delivered', request});

        this.database.ref('requests/' + rk).set(null, () => this.showMessage('Se entregaron chicos a ' + request.plate));
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

        await wait.sleep(300);

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
            this.database.ref('requests').push().set(r, () => this.showMessage('Se ha notificado al Colegio'));
            this.saveEvent({t: 'request', request: r});
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

            this.database.ref('2018/cars/' + newFamilyCar.car)
                .set(
                    id,
                    () => this.setState({...this.state, addingNewCar: false, searchText: '', searchResult: [], toasts: this.state.toasts.concat({text: 'Se ha agregado la nueva familia'})})
                );
        });

        this.saveEvent({t: 'newCar', newFamilyCar});
    }

    changeStatus(rk, status) {
        this.database.ref('requests/' + rk + '/statuses').push().set({state: status, uid: this.state.user.uid});
        this.saveEvent({t: 'changeStatus', rk, status});
    }

    renderPlatesSearch() {
        if (this.state.addingNewCar) return <AddNewCar previousPlate={this.state.searchText}
                                                       showMessage={m => this.showMessage(m)}
                                                       model={this.model}
                                                       editingFamily={this.state.editingFamily}
                                                       relations={relations}
                                                       onConfirmed={newFamilyCar => this.newCarConfirmed(newFamilyCar)}
                                                       onCancel={() => this.setState({...this.state, addingNewCar: false, searchText: '', searchResult: []})}/>;

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

                <div style={{display: 'flex', marginBottom: '20px', justifyContent: 'center'}}>
                    <img style={{width: '140px', height: '45px', marginTop: '30px'}} src={Logo} alt="Colegio Pestalozzi"/>
                </div>
                <div>
                    Aquí podés ingresar la patente de un auto que está esperando por sus hijos. Cuando lo confirmes un aviso se enviará al Colegio
                </div>
            </div>
            }
        </div>;
    }

    signIn(type) {
        const provider = type === 'google' ? new firebase.auth.GoogleAuthProvider() : new firebase.auth.FacebookAuthProvider();

        firebase.auth().signInWithPopup(provider).then(result => {
            console.warn('result:');
            console.warn(result);
        }).catch(error => {
            console.warn('error:');
            console.warn(JSON.parse(JSON.stringify(error)));
        });
    }

    loader() {
        return <div style={{
            margin: 0,
            position: 'absolute',
            top: '46%',
            fontSize: 40,
            fontWeight: 600,
            color: '#555',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}>
            <div className="ball-pulse-sync">
                <div style={{backgroundColor: '#2a55ad'}}/>
                <div style={{backgroundColor: '#2a55ad'}}/>
                <div style={{backgroundColor: '#2a55ad'}}/>
            </div>
        </div>;
    }

    render() {
        if (this.state.initializing) return this.loader();

        if (!this.user) return <Card style={{width: '70%', marginTop: '20px', padding: '20px'}} className="md-block-centered">
            <div className="firebaseui-container firebaseui-page-provider-sign-in firebaseui-id-page-provider-sign-in firebaseui-use-spinner">
                <ul className="firebaseui-idp-list">
                    <li className="firebaseui-list-item">
                        <button onClick={() => this.signIn('google')} className="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised firebaseui-idp-google firebaseui-id-idp-button">
                                <span className="firebaseui-idp-icon-wrapper">
                                    <img className="firebaseui-idp-icon" alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"/>
                                </span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-long">Acceder con Google</span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-short">Google</span>
                        </button>
                    </li>
                    <li className="firebaseui-list-item">
                        <button onClick={() => this.signIn('facebook')} className="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised firebaseui-idp-facebook firebaseui-id-idp-button">
                            <span className="firebaseui-idp-icon-wrapper">
                                <img className="firebaseui-idp-icon" alt="Facebook" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg"/>
                            </span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-long">Acceder con Facebook</span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-short">Facebook</span>
                        </button>
                    </li>
                </ul>
            </div>

            <div style={{display: 'flex', justifyContent: 'center'}}>
                <img style={{width: '280px', height: '91px', marginTop: '30px'}} src={Logo} alt="Colegio Pestalozzi"/>
            </div>
        </Card>;

        if (!this.model && !this.state.noAccess) return this.loader();

        if (this.state.noAccess) return <div style={{display: 'flex', flexDirection: 'column', marginTop: '70px', alignItems: 'center'}}>
            <FontIcon style={{fontSize: '170px'}}>pan_tool</FontIcon>

            <span className="md-caption md-text-center" style={{fontSize: '26px', margin: '20px'}}>¡Casi listo!</span>
            <span className="md-caption md-text-center" style={{fontSize: '26px', margin: '20px'}}>Solo falta que solicites acceso a otro voluntario</span>
        </div>;

        if (!this.state.connected) return <div style={{display: 'flex', flexDirection: 'column', marginTop: '70px', alignItems: 'center'}}>
            <FontIcon style={{fontSize: '170px'}}>signal_wifi_off</FontIcon>
            <span className="md-caption md-text-center" style={{fontSize: '28px'}}>En este momento no tenés conexión a internet</span>
        </div>;

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

            {(!this.state.addingNotes && this.state.tabIndex === 0) && this.renderPlatesSearch()}

            {this.state.tabIndex === 1 && <Students
                requests={this.state.requests}
                users={this.state.users}
                currentUser={this.state.user}
                onDelivered={rk => this.onDelivered(rk)}
                onChangeStatus={(rk, status) => this.changeStatus(rk, status)}
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
                    {label: 'AUTOS', icon: <FontIcon>directions_car</FontIcon>},
                    {label: 'ALUMNOS', icon: <FontIcon>face</FontIcon>}
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
