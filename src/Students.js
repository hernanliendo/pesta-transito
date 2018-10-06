import React from "react";
import PropTypes from "prop-types";
import {Avatar, Button, Divider, FontIcon} from 'react-md';

const createReactClass = require('create-react-class');
const _ = require('lodash');
const wait = require('wait-promise');

let animationOnItem = -1;

const Students = createReactClass({

    getInitialState() {
        return {
            previousRequests: []
        };
    },

    componentDidMount() {
        this.setState({...this.getInitialState(), previousRequests: this.props.requests});
    },

    componentDidUpdate() {
        if (animationOnItem !== -1 || _.isEqual(this.props.requests, this.state.previousRequests)) return;

        if (this.props.requests.length < this.state.previousRequests.length)
            this.animateItemOut();
        else
            this.setState({...this.state, previousRequests: this.props.requests});
    },

    async animateItemOut() {
        const diff = this.state.previousRequests.filter(rr => !_.find(this.props.requests, {plate: rr.plate}));

        if (diff.length > 0) {
            animationOnItem = _.findIndex(this.state.previousRequests, {plate: diff[0].plate});

            this.forceUpdate();

            await wait.sleep(900);
        }

        animationOnItem = -1;
        this.setState({...this.state, previousRequests: this.props.requests});
    },

    studentString(r, s) {
        const familyName = r.family.n.toLowerCase();
        let studentName = s[0].toLowerCase();

        if (studentName.indexOf(familyName) === -1)
            studentName += ' ' + familyName;

        return _.join(_.split(studentName, ' ').map(t => _.capitalize(t)), ' ') + ' (' + s[1].toUpperCase().trim() + ')';
    },

    renderRequest(r, ridx) {
        const lastStatus = _.last(_.toPairs(r.statuses || {}));
        const lastState = !lastStatus ? 'pending' : lastStatus[1].state;
        const lastUser = !lastStatus ? r.uid : lastStatus[1].uid;
        const onCharge = 'pending' === lastState ? 'Esperando' : _.split(this.props.users[lastUser].displayName, ' ')[0] + ' va llevando';
        let color;

        if (lastStatus && lastStatus[1].uid === this.props.currentUser.uid && 'pending' !== lastState)
            color = '#FFEB3B';
        else if ('pending' !== lastState)
            color = 'rgba(0, 0, 0, 0.1)';
        else
            color = null;


        return <div key={ridx}>
            <div style={{
                display: 'flex', minHeight: '140px', alignItems: 'center', backgroundColor: color, justifyContent: 'center',
                animation: ridx === animationOnItem ? 'removing-item 1s' : null
            }}>
                <div style={{marginRight: '10px'}}>
                    <Avatar icon={<FontIcon>face</FontIcon>}/>
                    <Avatar style={{height: '27px', width: '27px', marginLeft: '-10px'}} contentStyle={{fontSize: '17px'}} suffix={Avatar.defaultProps.suffixes[r.ord]} random>{r.ord}</Avatar>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', marginRight: '10px', width: 'calc(100vw - 225px)'}}>

                    {_.toPairs(r.family.ks).filter((p, pidx) => !r.unrequested || !r.unrequested[pidx]).map(p =>
                        <div key={p[0]} className="text-height md-text md-font-semibold ptext-wrap">{this.studentString(r, p)}</div>)}

                    {r.notes && <div style={{color: '#D32F2F'}} className="text-height md-text md-font-bold ptext-wrap">{r.notes}</div>}

                    <div className="text-height md-text ptext-wrap md-font-semibold">{r.plate}</div>

                    {/*{_.toPairs(r.family.ds).map(p => <div key={p[0]} className="md-text--secondary ptext-wrap">{p[0] + ': ' + p[1]}</div>)}*/}

                    <div className="text-height md-caption ptext-wrap">{onCharge}</div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', minWidth: '120px'}}>

                    {(this.props.isTeacher && 'pending' === lastState) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.props.onChangeStatus(r.k, 'transit')}>AHí VAMOS11</Button>
                    </div>
                    }

                    {(!this.props.isTeacher && 'pending' === lastState) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.props.onChangeStatus(r.k, 'transit')}>AHí VAMOS</Button>
                    </div>
                    }

                    {'transit' === lastState &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.props.onDelivered(r.k)}>ENTREGADO</Button>
                        <Button raised onClick={() => this.props.onChangeStatus(r.k, 'pending')}>CANCELO</Button>
                    </div>
                    }
                </div>
            </div>

            <Divider/>
        </div>;
    },

    render() {
        return <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>

            <div style={{display: 'flex', flexDirection: 'column'}}>

                {this.state.previousRequests.length === 0 &&
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <FontIcon style={{fontSize: '250px'}}>face</FontIcon>
                    <span className="md-caption md-text-center" style={{fontSize: '30px'}}>En este momento no hay autos esperando</span>
                </div>
                }

                {this.state.previousRequests.map((r, ridx) => this.renderRequest(r, ridx))}

                <div style={{marginBottom: '30px'}}>&nbsp;</div>
            </div>
        </div>;
    }
});

Students.propTypes = {
    requests: PropTypes.array.isRequired,
    users: PropTypes.object.isRequired,
    currentUser: PropTypes.object.isRequired,
    isTeacher: PropTypes.bool,
    onDelivered: PropTypes.func.isRequired,
    onChangeStatus: PropTypes.func.isRequired
};
export default Students;
