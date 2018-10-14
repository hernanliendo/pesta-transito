import React from "react";
import PropTypes from "prop-types";
import Avatar from 'react-md/lib/Avatars/Avatar';
import Button from 'react-md/lib/Buttons/Button';
import Divider from 'react-md/lib/Dividers/Divider';
import FontIcon from 'react-md/lib/FontIcons/FontIcon';
import SVGIcon from 'react-md/lib/SVGIcons/SVGIcon';

import Logo from "../logo.png";

const _ = require('lodash');
const wait = require('wait-promise');

const WhatsAppIcon = () => (
    <SVGIcon viewBox="0 0 448 512" style={{fill: 'white', height: '18px', width: '18px'}}>
        <path
            d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </SVGIcon>
);

let animationOnItem = -1;

class Students extends React.Component {

    componentWillMount() {
        this.setState({previousRequests: this.props.requests || []});
    }

    componentDidUpdate() {
        if (animationOnItem !== -1 || _.isEqual(this.props.requests, this.state.previousRequests)) return;

        if (this.props.requests.length < this.state.previousRequests.length)
            this.animateItemOut().then();
        else
            this.setState({...this.state, previousRequests: this.props.requests});
    }

    async animateItemOut() {
        const diff = this.state.previousRequests.filter(rr => !_.find(this.props.requests, {plate: rr.plate}));

        if (diff.length > 0) {
            animationOnItem = _.findIndex(this.state.previousRequests, {plate: diff[0].plate});

            this.forceUpdate();

            await wait.sleep(900);
        }

        animationOnItem = -1;
        this.setState({...this.state, previousRequests: this.props.requests});
    }

    studentString(r, s) {
        const familyName = r.family.n.toLowerCase();
        let studentName = s[0].toLowerCase();

        if (studentName.indexOf(familyName) === -1)
            studentName += ' ' + familyName;

        return _.join(_.split(studentName, ' ').map(t => _.capitalize(t)), ' ') + ' (' + s[1].toUpperCase().trim() + ')';
    }

    renderRequest(r, ridx) {
        const lastStatus = _.last(_.toPairs(r.statuses || {}));
        const lastState = !lastStatus ? 'pending' : lastStatus[1].state;
        const lastUser = !lastStatus ? r.uid : lastStatus[1].uid;
        let onCharge = (lastUser !== 'system' ? _.split(this.props.users[lastUser].displayName, ' ')[0] : '') + ' va llevando';

        if ('pending' === lastState)
            onCharge = 'Esperando';
        else if ('parentReplied' === lastState)
            onCharge = `Conductor dijo: ${lastStatus[1].resp}`;
        else if ('requestWhatsApp' === lastState)
            onCharge = 'Esperá confirmación del conductor';

        const isPendingRequest = 'pending' === lastState;
        const teacherHidden = r.teacherHidden === 1;
        let color;
        let plateFontSize = '14px';

        if (lastStatus && lastStatus[1].uid === this.props.currentUser.uid && 'pending' !== lastState) {
            color = '#FFEB3B';
            plateFontSize = '24px';
        }
        else if ('pending' !== lastState)
            color = 'rgba(0, 0, 0, 0.1)';
        else
            color = null;

        if (this.props.isTeacher && (!isPendingRequest || teacherHidden)) return <div key={ridx}/>;


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

                    <div style={{fontSize: plateFontSize}} className="text-height md-text ptext-wrap md-font-semibold">{r.plate}</div>

                    <div className="text-height md-caption ptext-wrap">{onCharge}</div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', minWidth: '120px'}}>

                    {(this.props.isTeacher && isPendingRequest) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.props.onChangeStatus(r, 'teacherDelivered')}>ENTREGADO</Button>
                    </div>
                    }

                    {(!this.props.isTeacher && isPendingRequest) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.props.onChangeStatus(r, 'transit')}>AHí VAMOS</Button>

                        {_.has(r, 'family.wsapp0') &&
                        <Button style={{marginBottom: '5px'}} iconEl={<WhatsAppIcon/>} raised primary onClick={() => this.props.onChangeStatus(r, 'requestWhatsApp')}>A DARSENA</Button>
                        }
                    </div>
                    }

                    {('transit' === lastState || 'parentReplied' === lastState) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button style={{marginBottom: '5px'}} raised primary onClick={() => this.props.onDelivered(r.k)}>ENTREGADO</Button>
                        <Button raised onClick={() => this.props.onChangeStatus(r, 'pending')}>CANCELO</Button>
                    </div>
                    }

                    {'requestWhatsApp' === lastState &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <Button raised onClick={() => this.props.onChangeStatus(r, 'pending')}>CANCELO</Button>
                    </div>
                    }
                </div>
            </div>

            <Divider/>
        </div>;
    }

    render() {
        return <div className="md-block-centered md-cell--12-phone md-cell--12-tablet md-cell--4-desktop" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>

            <div style={{display: 'flex', flexDirection: 'column'}}>

                {this.state.previousRequests.length === 0 &&
                <div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <FontIcon style={{fontSize: '250px'}}>face</FontIcon>
                        <span className="md-caption md-text-center" style={{fontSize: '30px'}}>En este momento no hay autos esperando</span>
                    </div>

                    <div style={{display: 'flex', marginBottom: '20px', justifyContent: 'center'}}>
                        <img style={{width: '140px', height: '45px', marginTop: '30px'}} src={Logo} alt="Colegio Pestalozzi"/>
                    </div>
                </div>
                }

                {this.state.previousRequests.map((r, ridx) => this.renderRequest(r, ridx))}

                <div style={{marginBottom: '30px'}}>&nbsp;</div>
            </div>
        </div>;
    }
}

Students.propTypes = {
    requests: PropTypes.array.isRequired,
    users: PropTypes.object.isRequired,
    currentUser: PropTypes.object.isRequired,
    isTeacher: PropTypes.bool,
    onDelivered: PropTypes.func.isRequired,
    onChangeStatus: PropTypes.func.isRequired
};
export default Students;
