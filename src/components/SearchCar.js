import React from "react";
import PropTypes from "prop-types";
import Avatar from 'react-md/lib/Avatars/Avatar';
import Button from 'react-md/lib/Buttons/Button';
import FontIcon from 'react-md/lib/FontIcons/FontIcon';
import TextField from 'react-md/lib/TextFields/TextField';

import AddNewCar from "./AddNewCar";

const wait = require('wait-promise');
const _ = require('lodash');

class SearchCar extends React.Component {

    textChanged(t) {
        const v = t.replace(/[^a-z0-9]/gi, '').toUpperCase();

        if (v.length <= 7)
            this.props.setState({...this.props.state, searchText: v, searchResult: v.length === 0 ? [] : Object.keys(this.props.model.cars).filter(c => c.indexOf(v) !== -1)});
    }

    async clearText() {
        this.props.setState({...this.props.state, searchText: '', searchResult: []});

        await wait.sleep(400);

        if (this.plateSearchRef)
            this.plateSearchRef.focus();
    }

    renderResults(plate, ridx) {
        const family = this.props.model.families[this.props.model.cars[plate]];

        if (!family) return <div/>;

        return <div onClick={() => this.props.setState({...this.props.state, addingNotes: {plate, family}, searchText: '', searchResult: []})}
                    key={ridx} style={{display: 'flex', marginBottom: '25px', minHeight: '100px', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{marginRight: '10px', minWidth: '40px'}}>
                <Avatar icon={<FontIcon style={{marginTop: '-4px', marginLeft: '1px'}}>directions_car</FontIcon>}/>
            </div>

            <div style={{marginRight: '10px', width: 'calc(100vw - 225px)', maxHeight: '100px'}}>
                <div className="md-text ptext-wrap md-font-semibold">{plate + ' ' + family.n}</div>

                {_.toPairs(family.ks).map(p => <div key={p[0]} className="md-text--secondary ptext-wrap">{p[0] + ', ' + p[1]}</div>)}

            </div>

            <div style={{display: 'flex', flexDirection: 'column', minWidth: '120px'}}>
                <Button style={{marginBottom: '5px'}} raised primary
                        onClick={() => this.props.setState({...this.props.state, addingNotes: {plate, family}, searchText: '', searchResult: []})}>SELECCIONAR</Button>
            </div>
        </div>;
    }

    render() {
        if (this.props.state.addingNewCar) return <AddNewCar previousPlate={this.props.state.searchText}
                                                             showMessage={m => this.props.showMessage(m)}
                                                             model={this.props.model}
                                                             isJardinFamilyAdmin={this.props.isJardinFamilyAdmin}
                                                             editingFamily={this.props.state.editingFamily}
                                                             relations={this.props.relations}
                                                             onConfirmed={newFamilyCar => this.props.newCarConfirmed(newFamilyCar)}
                                                             onCancel={() => this.props.setState({...this.props.state, editingFamily: null, addingNewCar: false, searchText: '', searchResult: []})}/>;

        const plates = this.props.state.searchResult;
        const searchText = this.props.state.searchText;

        return <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{marginTop: '4px', display: 'flex', flexDirection: 'column'}}>

            {!this.props.state.addingNotes &&
            <div style={{display: 'flex', alignItems: 'flex-end', marginTop: '-9px'}}>
                <TextField
                    id="patente"
                    label="Patente"
                    ref={ref => this.plateSearchRef = ref}
                    fullWidth
                    leftIcon={<FontIcon>directions_car</FontIcon>}
                    onChange={v => this.textChanged(v)}
                    value={this.props.state.searchText}
                    lineDirection="center"
                    className="md-cell md-cell--bottom"
                />

                {searchText.length > 0 &&
                <Button onClick={() => this.clearText()} style={{marginBottom: '10px', marginLeft: '-50px'}} icon iconChildren={<FontIcon>clear</FontIcon>}/>
                }
            </div>
            }

            <div style={{display: 'flex', flexDirection: 'column'}}>
                {
                    (plates.length === 0 && this.props.state.searchText.length > 0) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <Button style={{fontSize: '18px'}} flat primary onClick={() => this.props.setState({...this.props.state, addingNewCar: true})}>AGREGAR AUTO</Button>
                        <span className="md-caption" style={{fontSize: '30px'}}>Sin resultados</span>
                        <FontIcon style={{fontSize: '250px'}}>directions_car</FontIcon>
                    </div>
                }

                {plates.map((p, ridx) => this.renderResults(p, ridx))}

                {!this.props.state.addingNotes &&
                <div style={{marginBottom: '50px'}}>&nbsp;</div>
                }
            </div>

            {(plates.length === 0 && this.props.state.searchText.length === 0 && !this.props.state.addingNotes) &&
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
}

SearchCar.propTypes = {
    state: PropTypes.object.isRequired,
    relations: PropTypes.array.isRequired,
    showMessage: PropTypes.func.isRequired,
    newCarConfirmed: PropTypes.func.isRequired,
    isJardinFamilyAdmin: PropTypes.bool,
    model: PropTypes.object,
    setState: PropTypes.func.isRequired
};
export default SearchCar;
