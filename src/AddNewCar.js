import React from "react";
import PropTypes from "prop-types";
import {Button, SelectField, TextField} from 'react-md';

const wait = require('wait-promise');
const _ = require('lodash');

const FIELDS = [
    'newPlate',
    'familyName',

    'driver0',
    'driverType0',
    'driver1',
    'driverType1',

    'student0',
    'grade0',
    'student1',
    'grade1',
    'student2',
    'grade2',
    'student3',
    'grade3',

    'wsapp0',
    'wsapp1',
    'wsapp2'
];

const TEXTS = {
    newPlate: 'Patente',
    familyName: 'Apellido Familia',

    driver0: '1er Conductor',
    driverType0: 'Relación 1er Cond.',
    driver1: '2do Conductor',
    driverType1: 'Relación 2do Cond.',

    student0: 'Chica/o 1',
    grade0: 'Grado Chica/o 1',
    student1: 'Chica/o 2',
    grade1: 'Grado Chica/o 2',
    student2: 'Chica/o 3',
    grade2: 'Grado Chica/o 3',
    student3: 'Chica/o 4',
    grade3: 'Grado Chica/o 4',

    wsapp0: 'WhatsApp 1',
    wsapp1: 'WhatsApp 2',
    wsapp2: 'WhatsApp 3'
};

class AddNewCar extends React.Component {

    getInitialState() {
        let s = {confirming: false};

        FIELDS.forEach(f => s[f] = '');

        s.driverType0 = 'Madre/Padre';
        s.driverType1 = 'Madre/Padre';
        s.familyId = null;

        return s;
    }

    componentDidMount() {
        if (this.props.editingFamily) {
            const f = this.props.editingFamily;
            let s = {...this.getInitialState()};

            s.newPlate = f.plate;
            s.familyName = f.n;

            let index = 0;

            _.toPairs(f.ds).forEach(p => {
                s['driver' + index] = p[0];
                s['driverType' + index] = p[1];
                index++;
            });

            index = 0;

            _.toPairs(f.ks).forEach(p => {
                s['student' + index] = p[0];
                s['grade' + index] = p[1];
                index++;
            });

            s.familyId = f.familyId;
            s.wsapp0 = f.wsapp0 || '';
            s.wsapp1 = f.wsapp1 || '';
            s.wsapp2 = f.wsapp2 || '';

            this.setState(s);
        }
        else
            this.setState({...this.getInitialState(), newPlate: this.props.previousPlate ? this.props.previousPlate.trim() : ''});

        this.doFocus('patente').then();
    }

    async doFocus(id) {
        await wait.sleep(400);

        if (this[id])
            this[id].focus();
    }

    inputChanged(v, id) {
        let s = {...this.state};

        s[id] = v;

        this.setState(s);
    }

    renderInput(id, wsapp) {
        return <div style={{display: 'flex', alignItems: 'flex-end'}}>
            <TextField
                id={id}
                onChange={v => wsapp ? this.wsappInputChanged(v, id) : this.inputChanged(v, id)}
                value={this.state[id]}
                label={TEXTS[id]}
                ref={el => this[id] = el}
                fullWidth
                inputStyle={{minWidth: '300px'}}
                lineDirection="center"
                className="md-cell md-cell--bottom"
            />
        </div>;
    }

    renderSelect(id) {
        return <SelectField
            id={id}
            ref={el => this[id] = el}
            label={TEXTS[id]}
            onChange={v => this.inputChanged(v, id)}
            value={this.state[id]}
            className="md-cell"
            menuItems={this.props.relations}
            simplifiedMenu={true}
        />;
    }

    plateChanged(t) {
        const v = t.replace(/[^a-z0-9]/gi, '').toUpperCase();

        if (v.length <= 7)
            this.setState({...this.state, newPlate: v});
    }

    wsappInputChanged(t, id) {
        const v = t.replace(/[^0-9]/gi, '');

        let s = {...this.state};

        s[id] = v;

        this.setState(s);
    }

    async checkMandatory(arr) {
        const missing = arr.filter(k => !this.state[k]);

        if (missing.length > 0) {
            this.setState({...this.state, confirming: false});
            await wait.sleep(200);
            this.props.showMessage('Falta completar ' + TEXTS[missing[0]]);
            return true;
        }
        return false;
    }

    dataConfirmed() {
        this.checkMandatory(['newPlate', 'familyName', 'driver0', 'student0', 'grade0']).then(problems => {
            if (problems) return;

            const data = this.state;
            let ds = {};
            ds[data.driver0] = data.driverType0;

            let ks = {};
            ks[data.student0] = data.grade0;

            let r = {
                ds: ds,
                ks: ks,
                n: data.familyName
            };

            if (data.driver1) ds[data.driver1] = data.driverType1;
            if (data.student1 && data.grade1) ks[data.student1] = data.grade1;
            if (data.student2 && data.grade2) ks[data.student2] = data.grade2;
            if (data.student3 && data.grade3) ks[data.student3] = data.grade3;

            r.wsapp0 = _.get(data, 'wsapp0', null);
            r.wsapp1 = _.get(data, 'wsapp1', null);
            r.wsapp2 = _.get(data, 'wsapp2', null);

            this.props.onConfirmed({family: r, car: data.newPlate, familyId: data.familyId});
        });
    }

    render() {
        return <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{marginTop: '10px', display: 'flex', flexDirection: 'column'}}>

            <div style={{display: 'flex', flexDirection: 'column'}}>

                <div style={{display: 'flex', alignItems: 'flex-end'}}>
                    <TextField
                        id="newPlate"
                        label={TEXTS.newPlate}
                        ref={ref => this.newPlate = ref}
                        fullWidth
                        inputStyle={{minWidth: '300px'}}
                        onChange={v => this.plateChanged(v)}
                        value={this.state.newPlate}
                        lineDirection="center"
                        className="md-cell md-cell--bottom"
                    />
                </div>

                {this.renderInput('familyName')}
                {this.renderInput('driver0')}
                {this.renderSelect('driverType0')}

                {this.renderInput('driver1')}
                {this.renderSelect('driverType1')}

                {this.renderInput('student0')}
                {this.renderInput('grade0')}

                {this.renderInput('student1')}
                {this.renderInput('grade1')}

                {this.renderInput('student2')}
                {this.renderInput('grade2')}

                {this.renderInput('grade3')}
                {this.renderInput('student3')}

                {this.renderInput('wsapp0', true)}
                {this.renderInput('wsapp1', true)}
                {this.renderInput('wsapp2', true)}

                {!this.state.confirming &&
                <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                    <Button raised primary onClick={() => this.setState({...this.state, confirming: true})}>GUARDAR</Button>
                    <Button raised onClick={() => this.props.onCancel()}>CANCELAR</Button>
                </div>
                }

                {this.state.confirming &&
                <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                    <Button raised primary onClick={() => this.dataConfirmed()}>¡SEGURO! CONFIRMO</Button>
                    <Button raised secondary onClick={() => this.setState({...this.state, confirming: false})}>NO CONFIRMAR</Button>
                </div>
                }

                <div style={{height: '70px'}}>&nbsp;</div>
            </div>
        </div>;
    }
}

AddNewCar.propTypes = {
    previousPlate: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    relations: PropTypes.array.isRequired,
    onConfirmed: PropTypes.func.isRequired,
    showMessage: PropTypes.func.isRequired,
    editingFamily: PropTypes.object,
    model: PropTypes.object.isRequired
};
export default AddNewCar;
