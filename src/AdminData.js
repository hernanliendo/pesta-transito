import React from "react";
import PropTypes from "prop-types";
import './App.css';
import {Button} from "react-md";

const createReactClass = require('create-react-class');
const _ = require('lodash');

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

        return <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{display: 'flex', flexDirection: 'column', marginTop: '30px'}}>

            {items.map(this.renderItem)}

            <div style={{marginBottom: '50px'}}>&nbsp;</div>

        </div>;
    }
});

AdminData.propTypes = {
    model: PropTypes.object.isRequired,
    onEditFamily: PropTypes.func.isRequired,
    db: PropTypes.object.isRequired
};
export default AdminData;
