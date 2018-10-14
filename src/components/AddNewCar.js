import React from "react";
import PropTypes from "prop-types";
import Button from 'react-md/lib/Buttons/Button';
import SelectField from 'react-md/lib/SelectFields/SelectField';
import Subheader from 'react-md/lib/Subheaders/Subheader';
import TextField from 'react-md/lib/TextFields/TextField';

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

    driver0: 'Nombre',
    driverType0: 'Relación',
    driver1: 'Nombre',
    driverType1: 'Relación',

    student0: 'Nombre',
    student1: 'Nombre',
    student2: 'Nombre',
    student3: 'Nombre',

    grade_grade0: 'Grado',
    div_grade0: 'División',

    grade: 'Grado',
    division: 'División',

    wsapp0: 'WhatsApp 1',
    wsapp1: 'WhatsApp 2',
    wsapp2: 'WhatsApp 3'
};

const GRADES = ['Sala 2', 'Sala 3', 'Sala 4', 'Sala 5', '1ro', '2do', '3ro', '4to', '5to', '6to', '7mo'];

const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

class AddNewCar extends React.Component {

    componentWillMount() {
        let s = {confirming: false};

        FIELDS.forEach(f => s[f] = '');

        s.driverType0 = 'Madre/Padre';
        s.driverType1 = 'Madre/Padre';
        s.familyId = null;

        if (this.props.editingFamily) {
            const f = this.props.editingFamily;

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

                const split = p[1].split('_');
                s['grade_grade' + index] = split[0];
                s['div_grade' + index] = split[1];
                index++;
            });

            s.familyId = f.familyId;
            s.wsapp0 = f.wsapp0 || '';
            s.wsapp1 = f.wsapp1 || '';
            s.wsapp2 = f.wsapp2 || '';

            this.setState(s);
        }
        else
            this.setState({...s, newPlate: this.props.previousPlate ? this.props.previousPlate.trim() : ''});

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

    renderGrade(id) {
        return <div>
            <SelectField
                id={'grade_' + id}
                ref={el => this['grade_' + id] = el}
                label={TEXTS['grade']}
                onChange={v => this.inputChanged(v, 'grade_' + id)}
                value={this.state['grade_' + id]}
                className="md-cell"
                menuItems={GRADES}
                simplifiedMenu={true}
            />

            <SelectField
                id={'div_' + id}
                ref={el => this['div_' + id] = el}
                label={TEXTS['division']}
                onChange={v => this.inputChanged(v, 'div_' + id)}
                value={this.state['div_' + id]}
                className="md-cell"
                menuItems={DIVISIONS}
                simplifiedMenu={true}
            />
        </div>;
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
        this.checkMandatory(['newPlate', 'familyName', 'driver0', 'student0', 'grade_grade0', 'div_grade0']).then(problems => {
            if (problems) return;

            const data = this.state;
            let ds = {};
            ds[data.driver0] = data.driverType0;

            let ks = {};
            ks[data.student0] = `${data.grade_grade0}_${data.div_grade0}`;

            let r = {
                ds: ds,
                ks: ks,
                n: data.familyName
            };

            if (data.driver1) ds[data.driver1] = data.driverType1;
            if (data.student1 && data.grade_grade1) ks[data.student1] = `${data.grade_grade1}_${data.div_grade1}`;
            if (data.student2 && data.grade_grade2) ks[data.student2] = `${data.grade_grade2}_${data.div_grade2}`;
            if (data.student3 && data.grade_grade3) ks[data.student3] = `${data.grade_grade3}_${data.div_grade3}`;

            r.wsapp0 = AddNewCar.resolveWhatsApp('wsapp0', data);
            r.wsapp1 = AddNewCar.resolveWhatsApp('wsapp1', data);
            r.wsapp2 = AddNewCar.resolveWhatsApp('wsapp2', data);

            this.props.onConfirmed({family: r, car: data.newPlate, familyId: data.familyId});
        });
    }

    static resolveWhatsApp(id, data) {
        const r = _.get(data, id, null);

        if (r && !r.startsWith('5411')) return '5411' + r;

        return r;
    }

    static title(t) {
        return <Subheader style={{listStyleType: 'none', fontSize: '22px', marginTop: '60px'}} primary primaryText={t}/>;
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


                {AddNewCar.title('Primer Conductor')}

                {this.renderInput('driver0')}
                {this.renderSelect('driverType0')}


                {AddNewCar.title('Segundo Conductor')}
                {this.renderInput('driver1')}
                {this.renderSelect('driverType1')}

                {AddNewCar.title('Primer Alumno')}
                {this.renderInput('student0')}
                {this.renderGrade('grade0')}

                {AddNewCar.title('Segundo Alumno')}
                {this.renderInput('student1')}
                {this.renderGrade('grade1')}

                {AddNewCar.title('Tercer Alumno')}
                {this.renderInput('student2')}
                {this.renderGrade('grade2')}

                {AddNewCar.title('Cuarto Alumno')}
                {this.renderInput('student3')}
                {this.renderGrade('grade3')}

                {AddNewCar.title('Números WhatsApp')}
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
